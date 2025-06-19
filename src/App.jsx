import React, { useState, useEffect } from 'react';

// Main App component
const App = () => {
  // State variables for form inputs and transactions
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [userId, setUserId] = useState(() => {
    // Generate a simple, persistent user ID for demonstration
    // In a real app, this would come from a proper authentication system
    const storedUserId = localStorage.getItem('financeAppUserId');
    if (storedUserId) {
      return storedUserId;
    }
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('financeAppUserId', newUserId);
    return newUserId;
  });

  // Base URL for your backend API
  // IMPORTANT: Ensure this matches the port your server.js is running on
  const API_BASE_URL = 'http://localhost:5000/api';

  // Function to fetch transactions from the backend
  const fetchTransactions = async () => {
    console.log("Attempting to fetch transactions from backend..."); // Added console log
    setLoading(true);
    try {
      // Fetch transactions for the current userId
      const response = await fetch(`${API_BASE_URL}/transactions/${userId}`);
      if (!response.ok) {
        // If the response itself is not OK (e.g., 404, 500 from server)
        const errorText = await response.text(); // Get raw error message from server
        throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorText || 'No message provided.'}`);
      }
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      let userMessage = `Error fetching data: ${error.message}`;
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        userMessage = `Could not connect to the backend server at ${API_BASE_URL}. Please ensure your backend (server.js) is running in a separate terminal.`;
      }
      setMessage(userMessage);
      setShowMessage(true);
      setTransactions([]); // Clear transactions on error
    } finally {
      setLoading(false);
    }
  };

  // Effect hook to fetch transactions on component mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchTransactions();
    }
  }, [userId]); // Re-fetch when userId changes

  // Handles adding a new transaction
  const handleAddTransaction = async () => {
    if (!description.trim() || !amount) {
      setMessage("Please enter both description and amount.");
      setShowMessage(true);
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage("Please enter a valid positive amount.");
      setShowMessage(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description.trim(), amount: numAmount, type, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Re-fetch all transactions to update the list, including the new one
      await fetchTransactions();
      setDescription('');
      setAmount('');
      setType('expense'); // Reset type to default
      setMessage("Transaction added successfully!");
      setShowMessage(true);
    } catch (e) {
      console.error("Error adding transaction: ", e);
      let userMessage = `Error adding transaction: ${e.message}`;
      if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) {
        userMessage = `Could not connect to the backend server at ${API_BASE_URL}. Please ensure your backend (server.js) is running.`;
      }
      setMessage(userMessage);
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  // Handles deleting a transaction
  const handleDeleteTransaction = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Re-fetch all transactions to update the list
      await fetchTransactions();
      setMessage("Transaction deleted successfully!");
      setShowMessage(true);
    } catch (e) {
      console.error("Error deleting transaction: ", e);
      let userMessage = `Error deleting transaction: ${e.message}`;
      if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) {
        userMessage = `Could not connect to the backend server at ${API_BASE_URL}. Please ensure your backend (server.js) is running.`;
      }
      setMessage(userMessage);
      setShowMessage(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total income, expenses, and balance
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0); // Ensure amount is parsed as float

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0); // Ensure amount is parsed as float

  const balance = totalIncome - totalExpenses;

  // Custom Message Box component
  const MessageBox = ({ message, onClose }) => {
    if (!showMessage) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full relative">
          <p className="text-gray-800 text-lg mb-4">{message}</p>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close message"
          >
            &times;
          </button>
          <button
            onClick={onClose}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans text-gray-800 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <MessageBox message={message} onClose={() => setShowMessage(false)} />

      <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-800 mb-8 drop-shadow-lg text-center">
        Group 5 Student Finance Tracker
      </h1>

      {userId && (
        <p className="text-sm text-gray-600 mb-4 text-center">
          Your User ID (for data storage): <code className="bg-gray-200 p-1 rounded-md text-xs">{userId}</code>
        </p>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-6 text-center">Add New Transaction</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Scholarship, Rent, Books"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 500.00"
              min="0.01"
              step="0.01"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <button
            onClick={handleAddTransaction}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={loading}
          >
                    {loading ? 'Adding...' : 'Add Transaction'}
                  </button>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8 w-full max-w-2xl">
                <h2 className="text-2xl font-semibold text-indigo-700 mb-6 text-center">Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-green-700">${totalIncome.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg shadow-sm">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-700">${totalExpenses.toFixed(2)}</p>
                  </div>
                  <div className={`p-4 rounded-lg shadow-sm ${balance >= 0 ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                    <p className="text-sm text-gray-600">Balance</p>
                    <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-2xl">
                <h2 className="text-2xl font-semibold text-indigo-700 mb-6 text-center">Transaction History</h2>
                {loading && transactions.length === 0 && (
                    <p className="text-center text-gray-600">Loading transactions...</p>
                )}
                {!loading && transactions.length === 0 && (
                  <p className="text-center text-gray-600">No transactions recorded yet. Add one above!</p>
                )}
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-4 rounded-lg shadow-sm ${
                        transaction.type === 'income' ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'
                      }`}
                    >
                      <div>
                        <p className="text-lg font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(transaction.timestamp).toLocaleDateString()} at {new Date(transaction.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <p
                          className={`text-xl font-semibold ${
                            transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 text-gray-600 hover:text-gray-800 transition duration-150 ease-in-out"
                          aria-label={`Delete ${transaction.description}`}
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        };

        export default App;
