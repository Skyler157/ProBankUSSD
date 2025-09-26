const { registerUser, loginUser } = require('../models/user');

exports.handleUssd = async (req, res) => {
  let { sessionId, serviceCode, phoneNumber, text } = req.body;
  let textArray = text.split('*');
  let response = '';

  // ---------- MAIN WELCOME ----------
  if (text === '') {
    response = `CON Welcome to ProBank:
1. Register
2. Login
00. Exit`;
  }

  // ---------- REGISTRATION ----------
  else if (textArray[0] === '1') {
    if (textArray.length === 1) response = 'CON Enter your full name:';
    else if (textArray.length === 2) response = 'CON Enter your account number:';
    else if (textArray.length === 3) response = 'CON Create a 4-digit PIN:';
    else if (textArray.length === 4) response = 'CON Confirm your PIN:';
    else if (textArray.length === 5) {
      const success = await registerUser(textArray[1], textArray[2], textArray[3]);
      response = success
        ? 'END Registration successful! You can now login.'
        : 'END Registration failed. Try again.';
    }
  }

  // ---------- LOGIN ----------
  else if (textArray[0] === '2') {
    if (textArray.length === 1) response = 'CON Enter your account number:';
    else if (textArray.length === 2) response = 'CON Enter your PIN:';
    else if (textArray.length === 3) {
      const user = await loginUser(textArray[1], textArray[2]);
      if (!user) {
        response = 'END Invalid login. Try again.';
      } else {
        // Note: we don't persist session here; we assume subsequent requests include the same sessionId
        response = `CON Welcome ${user.full_name}!
1. Account Services
2. Transfer Money
3. Bill Payments
4. Loan Services
5. Help
00. Exit`;
      }
    }

    // ---------- AFTER LOGIN: handle the menu choices (indexes relative to login)
    else {
      const mainChoice = textArray[3]; // menu choice after successful login
      // --- Account Services (unchanged) ---
      if (mainChoice === '1') {
        if (textArray.length === 4) {
          response = `CON Account Services:
1. Check Balance
2. Mini-Statement
3. Change PIN
0. Back`;
        } else if (textArray.length === 5) {
          const choice = textArray[4];
          switch (choice) {
            case '1':
              response = 'END Your balance is KES 12,500';
              break;
            case '2':
              response = 'END Mini-statement:\n1. -500\n2. +1,000\n3. -200\n4. +3,000\n5. -100';
              break;
            case '3':
              response = 'CON Enter new PIN:';
              break;
            case '0':
              response = `CON Welcome back!
1. Account Services
2. Transfer Money
3. Bill Payments
4. Loan Services
5. Help
00. Exit`;
              break;
            default:
              response = 'END Invalid input';
          }
        } else if (textArray.length === 6 && textArray[4] === '3') {
          // Example: user entered new PIN then confirm step could be implemented here
          response = 'END PIN changed successfully!';
        }
      }

      // --- Transfer Money ---
      else if (mainChoice === '2') {
        if (textArray.length === 4) response = 'CON Enter recipient account number:';
        else if (textArray.length === 5) response = 'CON Enter amount to transfer:';
        else if (textArray.length === 6) response = 'CON Enter your PIN to confirm:';
        else if (textArray.length === 7) {
          let acct = textArray[4];
          let amount = textArray[5];
          response = `END Transfer of KES ${amount} to account ${acct} successful!`;
        }
      }

      // --- Bill Payments ---
      else if (mainChoice === '3') {
        if (textArray.length === 4) {
          response = `CON Bill Payments:
1. Electricity
2. Water
3. Cable TV
0. Back`;
        } else if (textArray.length === 5) {
          const choice = textArray[4];
          if (['1', '2', '3'].includes(choice)) response = 'CON Enter amount:';
          else if (choice === '0')
            response = `CON Welcome back!
1. Account Services
2. Transfer Money
3. Bill Payments
4. Loan Services
5. Help
00. Exit`;
          else response = 'END Invalid input';
        } else if (textArray.length === 6) response = 'CON Enter your PIN to confirm:';
        else if (textArray.length === 7) {
          const billType = { 1: 'Electricity', 2: 'Water', 3: 'Cable TV' }[textArray[4]];
          const amt = textArray[5];
          response = `END ${billType} bill of KES ${amt} paid successfully!`;
        }
      }

      // --- Loan Services (fixed & full flow) ---
      else if (mainChoice === '4') {
        if (textArray.length === 4) {
          response = `CON Loan Services:
1. Check Loan Balance
2. Apply for Loan
0. Back`;
        } else if (textArray.length === 5) {
          const choice = textArray[4];
          if (choice === '1') {
            // immediate info
            response = 'END Your loan balance is KES 50,000';
          } else if (choice === '2') {
            // ask for amount to apply for
            response = 'CON Enter loan amount you want to apply for:';
          } else if (choice === '0') {
            response = `CON Welcome back!
1. Account Services
2. Transfer Money
3. Bill Payments
4. Loan Services
5. Help
00. Exit`;
          } else {
            response = 'END Invalid input';
          }
        } else if (textArray.length === 6 && textArray[4] === '2') {
          // user entered desired loan amount; ask for PIN to confirm
          response = 'CON Enter your PIN to confirm loan application:';
        } else if (textArray.length === 7 && textArray[4] === '2') {
          // finalize application
          const amount = textArray[5];
          response = `END Loan application for KES ${amount} submitted successfully!`;
        }
      }

      // --- Help (improved menu & short FAQ) ---
      else if (mainChoice === '5') {
        if (textArray.length === 4) {
          response = `CON Help:
1. Contact Support
2. USSD Instructions
0. Back`;
        } else if (textArray.length === 5) {
          const choice = textArray[4];
          if (choice === '1') {
            response = 'END For support call 0796886037 or email support@probank.co.ke';
          } else if (choice === '2') {
            response = `END USSD Instructions:
- Use numbers to pick options.
- Press 0 to go back.
- Press 00 to exit.`;
          } else if (choice === '0') {
            response = `CON Welcome back!
1. Account Services
2. Transfer Money
3. Bill Payments
4. Loan Services
5. Help
00. Exit`;
          } else {
            response = 'END Invalid input';
          }
        }
      }

      // --- Exit pressed from main menu after login ---
      else if (mainChoice === '00') {
        response = 'END Thank you for using ProBank.';
      }

      // --- Unknown main choice ---
      else {
        response = 'END Invalid input';
      }
    }
  }

  // ---------- EXIT from initial menu ----------
  else if (textArray[0] === '00') {
    response = 'END Thank you for using ProBank.';
  }

  // ---------- DEFAULT ----------
  else {
    response = 'END Invalid input';
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
};
