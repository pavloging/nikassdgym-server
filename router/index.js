const Router = require('express').Router;
const userController = require('../controllers/user-controller');
const router = new Router();
const authMiddleware = require('../middlewares/auth-middleware');
const authValidation = require('../middlewares/validations.js');

router.post('/registration', authValidation, userController.registration);
router.post('/login', authValidation, userController.login);
router.post('/logout', userController.logout);
router.get('/reset/:email', userController.reset);
router.get('/password/:token', userController.passwordToken);
router.post('/password', userController.password);

router.post('/createLinkPay', authMiddleware, userController.createLinkPay);
router.post('/activateSubscription', authMiddleware, userController.activateSubscription);
router.get('/activate/:link', userController.activate);
router.get('/refresh', userController.refresh);
router.post('/webhook', userController.webhook);

module.exports = router;
