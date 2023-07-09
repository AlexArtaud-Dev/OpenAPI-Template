const router = require('express').Router();
require('dotenv').config();
const {User} = require("../models/models");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const {validationResult, check} = require("express-validator");


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user was successfully created
 *       400:
 *         description: Some parameters are missing or invalid
 */
router.post(
    '/register',
    [
        check('name', 'error_name_required').not().isEmpty(),
        check('email', 'error_email_required').isEmail(),
        check('password', 'error_password_complexity').matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%^&*()_+=\-[\]{}|\\:;'<>,.?/~`]).{12,}$/)
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) return res.status(400).json({ message: 'email_already_existss' });

            user = new User({name, email, password});

            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            await user.save();

            const payload = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                {
                    expiresIn: 1800, // 30 minutes
                },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            res.status(500).send({message : 'server_error'});
        }
    }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User successfully logged in
 *       400:
 *         description: Some parameters are missing or invalid
 */
router.post('/login', [
    check('email', 'error_email_invalid').isEmail(),
    check('password', 'error_password_required').exists(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'error_invalid_credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'error_invalid_credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: 1800, // 30 minutes
            },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        res.status(500).send({message : 'server_error'});
    }
});

/**
 * @swagger
 * /auth/validateToken:
 *   post:
 *     summary: Validate a JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: The token is valid
 *       400:
 *         description: The token is invalid
 *       498:
 *         description: The token is expired
 */
router.post('/validateToken', (req, res) => {
    const token = req.body.token;

    if (!token) {
        return res.status(400).json({ message: 'No token, authorization denied' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.json({ message: 'Token is valid' });
    } catch (err) {
        if(err.message === 'jwt expired') {
            res.status(498).json({ message: 'Token is expired' });
        } else {
            res.status(400).json({ message: 'Token is not valid' });
        }
    }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh the access token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: The access token was successfully refreshed
 *       400:
 *         description: The refresh token is missing or invalid
 *       498:
 *         description: The refresh token is expired
 */
router.post('/refresh', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh Token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const userId = decoded.user.id;

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Refresh Token' });
        }

        const payload = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {
                expiresIn: 1800, // 30 minutes
            },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        if(err.message === 'jwt expired') {
            res.status(498).json({ message: 'Token is expired' });
        } else {
            res.status(400).json({ message: 'Token is not valid' });
        }
    }
});



module.exports = router;
