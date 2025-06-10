const express = require('express');
const router = express.Router();
const sharePointController = require('../controllers/sharePointController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, sharePointController.createSharePoint);
router.get('/', protect, sharePointController.getAllSharePoints);
router.get('/:id', protect, sharePointController.getSharePointById);
router.put('/:id', protect, sharePointController.updateSharePoint);
router.delete('/:id', protect, sharePointController.deleteSharePoint);
router.post('/:id/sign', protect, sharePointController.signSharePoint);
router.post('/:id/approve', protect, sharePointController.approveSharePoint);
router.get('/my-assigned', protect, sharePointController.getMyAssignedSharePoints);
router.get('/my-created', protect, sharePointController.getMyCreatedSharePoints);
router.get('/', protect, sharePointController.getMyCreatedSharePoints);
router.get("/:id/can-sign/:userId?", sharePointController.canUserSign)
module.exports = router;