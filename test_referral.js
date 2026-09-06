const sequelize = require('./config/db');
const User = require('./modules/user/models/user.model');
const Referral = require('./modules/referral/models/referral.model');
const PointTransaction = require('./modules/points/models/pointTransaction.model');
const { markProfileCompleted, markFirstPost } = require('./modules/referral/services/referral.service');
const { award } = require('./modules/points/services/points.service');

const runTest = async () => {
  try {
    await sequelize.authenticate();
    console.log('DB Connected');
    await sequelize.sync({ alter: true });
    
    // Clean up
    await Referral.destroy({ where: {} });
    await PointTransaction.destroy({ where: { activityType: 'REFERRAL' } });
    await User.destroy({ where: { username: 'testreferrer' } });
    await User.destroy({ where: { username: 'testreferred' } });

    // Create referrer
    const referrer = await User.create({
      fullName: 'Test Referrer',
      username: 'testreferrer',
      email: 'referrer@test.com',
      referralCode: 'TEST1234',
      isVerified: true
    });

    // Create referred user
    const referred = await User.create({
      fullName: 'Test Referred',
      username: 'testreferred',
      email: 'referred@test.com',
      isVerified: true
    });

    // Create pending referral
    const referral = await Referral.create({
      referrerId: referrer.id,
      referredUserId: referred.id,
      referralCode: 'TEST1234',
      status: 'PENDING'
    });

    console.log('Referral created as PENDING');

    // Trigger profile complete
    await markProfileCompleted(referred.id);
    let updatedRef = await Referral.findByPk(referral.id);
    console.log('After profile complete - status:', updatedRef.status); // should be PENDING

    // Trigger first post
    await markFirstPost(referred.id);
    updatedRef = await Referral.findByPk(referral.id);
    console.log('After first post - status:', updatedRef.status); // should be COMPLETED
    console.log('Points awarded:', updatedRef.pointsAwarded); // should be 500

    const tx = await PointTransaction.findOne({ where: { userId: referrer.id, activityType: 'REFERRAL' } });
    console.log('Point transaction created:', !!tx, tx ? tx.points : 0);

    // Try again to test idempotency
    await markProfileCompleted(referred.id);
    await markFirstPost(referred.id);
    
    const count = await PointTransaction.count({ where: { userId: referrer.id, activityType: 'REFERRAL' } });
    console.log('Point transactions count after duplicate trigger (should be 1):', count);

  } catch (err) {
    console.error('Test failed', err);
  } finally {
    process.exit(0);
  }
};

runTest();
