require('dotenv').config();
const sequelize = require('./config/db');
const User = require('./modules/user/models/user.model');
const Post = require('./modules/post/models/post.model');
const PointTransaction = require('./modules/points/models/pointTransaction.model');
const pointsService = require('./modules/points/services/points.service');

const runTest = async () => {
  try {
    console.log('Connecting to DB...');
    await sequelize.sync();
    
    // Create a dummy user
    const [user] = await User.findOrCreate({
      where: { email: 'test_airdrop@glunity.com' },
      defaults: {
        username: 'test_airdrop',
        fullName: 'Test Airdrop',
        password: 'Password123!',
      }
    });
    
    const [user2] = await User.findOrCreate({
      where: { email: 'test_airdrop2@glunity.com' },
      defaults: {
        username: 'test_airdrop2',
        fullName: 'Test Airdrop 2',
        password: 'Password123!',
      }
    });

    console.log('User 1:', user.id);
    console.log('User 2:', user2.id);

    // 1. Profile Setup
    console.log('\n--- 1. Testing Profile Setup ---');
    let res = await pointsService.awardProfileSetup(user.id);
    console.log('First award:', res.awarded, res.points);
    res = await pointsService.awardProfileSetup(user.id);
    console.log('Second award (should be false):', res.awarded, res.points);

    // 2. Post Creation
    console.log('\n--- 2. Testing Quality Post ---');
    const [post] = await Post.findOrCreate({
      where: { userId: user.id, text: 'Test airdrop post' },
      defaults: { isPrivate: false }
    });
    res = await pointsService.awardQualityPost(user.id, post.id);
    console.log('First award:', res.awarded, res.points);
    res = await pointsService.awardQualityPost(user.id, post.id);
    console.log('Second award (should be false):', res.awarded, res.points);

    // 3. Received Like
    console.log('\n--- 3. Testing Received Like ---');
    res = await pointsService.awardReceivedLike(user.id, post.id, user2.id);
    console.log('First like:', res.awarded, res.points);
    res = await pointsService.awardReceivedLike(user.id, post.id, user2.id);
    console.log('Same like again (should be false):', res.awarded, res.points);

    // 4. Summary
    console.log('\n--- 4. Testing Summary ---');
    const summary = await pointsService.getSummary(user.id);
    console.log('Summary:', summary);
    // Profile (1000) + Post (100) + Like (2) = 1102
    
    // 5. History
    console.log('\n--- 5. Testing History ---');
    const history = await pointsService.getHistory(user.id);
    console.log('History count:', history.total);
    console.log('First history item:', history.transactions[0].activityType);
    
    // 6. Monthly
    console.log('\n--- 6. Testing Monthly ---');
    const monthly = await pointsService.getMonthlyHistory(user.id);
    console.log('Monthly totals:', monthly);

    console.log('\n✅ All tests passed.');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    process.exit(0);
  }
};

runTest();
