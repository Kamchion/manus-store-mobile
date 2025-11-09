import mysql from 'mysql2/promise';

async function updateShowTotals() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get current config
    const [rows] = await connection.execute(
      'SELECT * FROM systemConfig WHERE `key` = ?',
      ['report_config']
    );
    
    if (rows.length > 0) {
      const currentConfig = JSON.parse(rows[0].value);
      console.log('Current config:', JSON.stringify(currentConfig, null, 2));
      
      // Update showTotals to false
      if (currentConfig.pdf) {
        currentConfig.pdf.showTotals = false;
      }
      
      console.log('\nUpdated config:', JSON.stringify(currentConfig, null, 2));
      
      // Save back
      await connection.execute(
        'UPDATE systemConfig SET `value` = ? WHERE `key` = ?',
        [JSON.stringify(currentConfig), 'report_config']
      );
      
      console.log('\n✅ Configuration updated successfully!');
      console.log('showTotals is now:', currentConfig.pdf?.showTotals);
    } else {
      console.log('No report_config found in database');
    }
  } finally {
    await connection.end();
  }
}

updateShowTotals().catch(console.error);
