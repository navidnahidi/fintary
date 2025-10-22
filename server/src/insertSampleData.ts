#!/usr/bin/env node

import { db } from "./database";
import { OrderTransactionMatcher } from "./orderMatcher";



async function insertSampleData(): Promise<void> {
  const matcher = new OrderTransactionMatcher();

  try {
    console.log('🌱 Inserting sample data...');
    await matcher.insertSampleData();
    console.log('✅ Sample data inserted successfully!');
    
    // Show what was inserted
    const ordersResult = await db.query('SELECT COUNT(*) as count FROM orders');
    const transactionsResult = await db.query('SELECT COUNT(*) as count FROM transactions');
    
    console.log(`📊 Orders: ${ordersResult.rows[0].count}`);
    console.log(`📊 Transactions: ${transactionsResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
  } finally {
    await db.close();
  }
}

insertSampleData();
