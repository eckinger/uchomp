describe("userService", () => {
    it ("should pass sanity check", () => {
        expect(true).toBe(true)
    })
})

// Test suite for user_service methods
describe('User Service Tests', () => {
  // Tests for send_code function
  describe('send_code', () => {
    // Test valid email input
    test('should generate a code, store it in code table, and send email successfully', async () => {
      const email = 'test@example.com';
      const result = await user_service.send_code(email);
      expect(result.success).toBe(true);
      
      // Verify code was inserted into code table
      const codeRecord = await db.query('SELECT * FROM code WHERE email = $1', [email]);
      expect(codeRecord.rows.length).toBe(1);
      expect(codeRecord.rows[0].code).toBeDefined();
    });
    
    // Test invalid email format
    test('should reject invalid email formats', async () => {
      const invalidEmail = 'invalid-email';
      await expect(user_service.send_code(invalidEmail)).rejects.toThrow();
    });
    
    // Test duplicate email request
    test('should handle repeated requests from same email', async () => {
      const email = 'repeat@example.com';
      await user_service.send_code(email);
      const result = await user_service.send_code(email);
      
      // Should update existing code rather than creating duplicate
      const codeRecords = await db.query('SELECT * FROM code WHERE email = $1', [email]);
      expect(codeRecords.rows.length).toBe(1);
    });
  });
  
  // Tests for verify function
  describe('verify', () => {
    // Setup: Insert test code
    beforeEach(async () => {
      await db.query('INSERT INTO code (email, code, created_at) VALUES ($1, $2, $3)', 
        ['verify@example.com', '123456', new Date()]);
    });
    
    // Test successful verification
    test('should verify correct code, create user, and remove code', async () => {
      const email = 'verify@example.com';
      const code = '123456';
      
      const result = await user_service.verify(email, code);
      expect(result.success).toBe(true);
      
      // Code should be removed from code table
      const codeRecord = await db.query('SELECT * FROM code WHERE email = $1', [email]);
      expect(codeRecord.rows.length).toBe(0);
      
      // User should be added to user table
      const userRecord = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);
      expect(userRecord.rows.length).toBe(1);
    });
    
    // Test incorrect code
    test('should reject incorrect verification code', async () => {
      const email = 'verify@example.com';
      const wrongCode = '999999';
      
      const result = await user_service.verify(email, wrongCode);
      expect(result.success).toBe(false);
      
      // Code should still exist in code table
      const codeRecord = await db.query('SELECT * FROM code WHERE email = $1', [email]);
      expect(codeRecord.rows.length).toBe(1);
    });
    
    // Test expired code
    test('should reject expired verification codes', async () => {
      // Insert an expired code (more than 10 minutes old)
      const expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() - 15);
      
      await db.query('INSERT INTO code (email, code, created_at) VALUES ($1, $2, $3)', 
        ['expired@example.com', '123456', expiredDate]);
        
      const result = await user_service.verify('expired@example.com', '123456');
      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });
  });
  
  // Tests for get_name_and_cell function
  describe('get_name_and_cell', () => {
    // Setup: Insert test user
    beforeEach(async () => {
      await db.query('INSERT INTO "user" (email) VALUES ($1)', ['profile@example.com']);
    });
    
    // Test successful profile update
    test('should update user profile with name and cell number', async () => {
      const email = 'profile@example.com';
      const name = 'Test User';
      const cell = '123-456-7890';
      
      const result = await user_service.get_name_and_cell(email, name, cell);
      expect(result.success).toBe(true);
      
      // User data should be updated in user table
      const userRecord = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);
      expect(userRecord.rows.length).toBe(1);
      expect(userRecord.rows[0].name).toBe(name);
      expect(userRecord.rows[0].cell).toBe(cell);
    });
    
    // Test invalid cell format
    test('should reject invalid cell number formats', async () => {
      const email = 'profile@example.com';
      const name = 'Test User';
      const invalidCell = 'not-a-phone';
      
      await expect(user_service.get_name_and_cell(email, name, invalidCell))
        .rejects.toThrow(/invalid phone/i);
    });
    
    // Test nonexistent user
    test('should handle updating nonexistent user', async () => {
      const email = 'nonexistent@example.com';
      const name = 'Test User';
      const cell = '123-456-7890';
      
      await expect(user_service.get_name_and_cell(email, name, cell))
        .rejects.toThrow(/user not found/i);
    });
  });
  
  // Integration tests between methods
  describe('Integration Tests', () => {
    test('full user registration flow: send code, verify, update profile', async () => {
      const email = 'integration@example.com';
      const name = 'Integration Test';
      const cell = '555-123-4567';
      
      // Step 1: Send verification code
      const sendResult = await user_service.send_code(email);
      expect(sendResult.success).toBe(true);
      
      // Get the code from the database for testing purposes
      const codeRecord = await db.query('SELECT code FROM code WHERE email = $1', [email]);
      const code = codeRecord.rows[0].code;
      
      // Step 2: Verify the code
      const verifyResult = await user_service.verify(email, code);
      expect(verifyResult.success).toBe(true);
      
      // Step 3: Complete profile
      const profileResult = await user_service.get_name_and_cell(email, name, cell);
      expect(profileResult.success).toBe(true);
      
      // Verify final user state
      const userRecord = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);
      expect(userRecord.rows.length).toBe(1);
      expect(userRecord.rows[0].email).toBe(email);
      expect(userRecord.rows[0].name).toBe(name);
      expect(userRecord.rows[0].cell).toBe(cell);
    });
  });
  
  // Mock database failure tests
  describe('Database Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Mock database failure
      jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('Database connection error'));
      
      const email = 'error@example.com';
      const result = await user_service.send_code(email);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('database');
    });
  });
});


// Test suite for order_service methods
describe('Order Service Tests', () => {
  // Setup: Create test user
  beforeAll(async () => {
    await db.query('INSERT INTO "user" (email, name, cell) VALUES ($1, $2, $3)', 
      ['order_owner@example.com', 'Order Owner', '555-555-5555']);
      
    const userRecord = await db.query('SELECT id FROM "user" WHERE email = $1', ['order_owner@example.com']);
    testUserId = userRecord.rows[0].id;
  });
  
  // Tests for create_order function
  describe('create_order', () => {
    test('should create a new order with valid inputs', async () => {
      const restaurant = 'Test Restaurant';
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1); // Expires in 1 hour
      const location = 'Regenstein Library'; // Valid campus location
      
      const result = await order_service.create_order(testUserId, restaurant, expiration, location);
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      
      // Verify order was inserted into order_group table
      const orderRecord = await db.query('SELECT * FROM order_group WHERE id = $1', [result.orderId]);
      expect(orderRecord.rows.length).toBe(1);
      expect(orderRecord.rows[0].owner_id).toBe(testUserId);
      expect(orderRecord.rows[0].restaurant).toBe(restaurant);
      expect(orderRecord.rows[0].expiration).toEqual(expiration);
      expect(orderRecord.rows[0].loc).toBe(location);
    });
    
    // Test all valid campus locations
    test('should accept all valid campus locations', async () => {
      const restaurant = 'Location Test Restaurant';
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      
      // Test each valid location from the locs enum
      const validLocations = ['Regenstein Library', 'Harper Library', 'John Crerar Library'];
      
      for (const location of validLocations) {
        const result = await order_service.create_order(testUserId, restaurant, expiration, location);
        expect(result.success).toBe(true);
        
        const orderRecord = await db.query('SELECT loc FROM order_group WHERE id = $1', [result.orderId]);
        expect(orderRecord.rows[0].loc).toBe(location);
      }
    });
    
    test('should reject invalid campus location', async () => {
      const restaurant = 'Test Restaurant';
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const invalidLocation = 'Invalid Location'; // Not in the locs enum
      
      await expect(order_service.create_order(testUserId, restaurant, expiration, invalidLocation))
        .rejects.toThrow(/invalid location/i);
    });
    
    test('should reject empty restaurant name', async () => {
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const location = 'Regenstein Library';
      
      await expect(order_service.create_order(testUserId, '', expiration, location))
        .rejects.toThrow(/restaurant.*required/i);
    });
    
    test('should reject past expiration time', async () => {
      const restaurant = 'Test Restaurant';
      const pastExpiration = new Date();
      pastExpiration.setHours(pastExpiration.getHours() - 1); // 1 hour in the past
      const location = 'Harper Library';
      
      await expect(order_service.create_order(testUserId, restaurant, pastExpiration, location))
        .rejects.toThrow(/expiration.*future/i);
    });
    
    test('should reject nonexistent user ID', async () => {
      const restaurant = 'Test Restaurant';
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const location = 'John Crerar Library';
      
      const invalidUserId = 9999; // Assuming this ID doesn't exist
      
      await expect(order_service.create_order(invalidUserId, restaurant, expiration, location))
        .rejects.toThrow(/user not found/i);
    });
    
    test('should handle very long restaurant names', async () => {
      // Generate a very long restaurant name
      const longName = 'A'.repeat(255);  // Assuming varchar(255) limit
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const location = 'Regenstein Library';
      
      try {
        const result = await order_service.create_order(testUserId, longName, expiration, location);
        expect(result.success).toBe(true);
        
        const orderRecord = await db.query('SELECT restaurant FROM order_group WHERE id = $1', [result.orderId]);
        expect(orderRecord.rows[0].restaurant).toBe(longName);
      } catch (error) {
        // If error occurs, it should be specific to character limit
        expect(error.message).toMatch(/restaurant.*too long/i);
      }
    });
  });
  
  // Tests for delete_order function
  describe('delete_order', () => {
    let testOrderId;
    
    // Setup: Create a test order
    beforeEach(async () => {
      const restaurant = 'Delete Test Restaurant';
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const location = 'Regenstein Library';
      
      const result = await order_service.create_order(testUserId, restaurant, expiration, location);
      testOrderId = result.orderId;
    });
    
    test('should delete an existing order', async () => {
      const result = await order_service.delete_order(testOrderId);
      expect(result.success).toBe(true);
      
      // Verify order was removed from order_group table
      const orderRecord = await db.query('SELECT * FROM order_group WHERE id = $1', [testOrderId]);
      expect(orderRecord.rows.length).toBe(0);
    });
    
    test('should handle deleting nonexistent order', async () => {
      const invalidOrderId = 9999; // Assuming this ID doesn't exist
      
      const result = await order_service.delete_order(invalidOrderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
    
    test('should cascade delete any related food orders', async () => {
      // Add a food_order related to the order_group
      await db.query('INSERT INTO food_order (order_group_id, user_id) VALUES ($1, $2)', 
        [testOrderId, testUserId]);
        
      // Delete the order
      const result = await order_service.delete_order(testOrderId);
      expect(result.success).toBe(true);
      
      // Verify related food_order was also removed
      const foodOrderRecords = await db.query('SELECT * FROM food_order WHERE order_group_id = $1', [testOrderId]);
      expect(foodOrderRecords.rows.length).toBe(0);
    });
  });
  
  // Integration tests between user and order services
  describe('User-Order Integration', () => {
    test('full user registration and order creation flow', async () => {
      // Register new user
      const email = 'newuser@example.com';
      await user_service.send_code(email);
      
      const codeRecord = await db.query('SELECT code FROM code WHERE email = $1', [email]);
      const code = codeRecord.rows[0].code;
      
      await user_service.verify(email, code);
      await user_service.get_name_and_cell(email, 'New User', '555-123-7890');
      
      // Get user ID
      const userRecord = await db.query('SELECT id FROM "user" WHERE email = $1', [email]);
      const userId = userRecord.rows[0].id;
      
      // Create an order
      const restaurant = 'Integration Restaurant';
      const expiration = new Date();
      expiration.setHou
