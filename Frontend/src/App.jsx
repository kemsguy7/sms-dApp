import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import  { abi } from './abi.json'

// Contract ABI - You'll need to replace this with your actual ABI
const abi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "NotAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PersonNotFound",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "studentId",
        "type": "uint256"
      }
    ],
    "name": "StudentAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "StudentRemoved",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      }
    ],
    "name": "addStudent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "getStudentById",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          }
        ],
        "internalType": "struct StudentSystem.Class",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "removeStudent",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "students",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

function App() {
  const [students, setStudents] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const contractAddress = "0x25C15Ad14AF3842232d999DC6f2164D340F51951"; 

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setIsConnected(true);
        setAddress(accounts[0]);
        checkIfAdmin(accounts[0]);
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error("Error checking wallet connection");
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);
      setIsConnected(true);
      toast.success('Wallet connected successfully!');
      checkIfAdmin(accounts[0]);
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const checkIfAdmin = async (address) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const adminAddress = await contract.admin();
      setIsAdmin(adminAddress.toLowerCase() === address.toLowerCase());
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleAddStudent = async () => {
    if (!studentName) {
      toast.warning('Please enter a student name');
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      const tx = await contract.addStudent(studentName);
      toast.info('Adding student...', { autoClose: false, toastId: 'addStudent' });
      
      await tx.wait();
      toast.dismiss('addStudent');
      toast.success('Student added successfully!');
      setStudentName('');
      setShowModal(false);
    } catch (error) {
      console.error('Add student error:', error);
      toast.error(error.message.includes('NotAdmin') 
        ? 'Only admin can add students' 
        : 'Failed to add student: ' + error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchId) {
      toast.warning('Please enter a student ID');
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const student = await contract.getStudentById(searchId);
      setSelectedStudent({
        name: student.name,
        id: Number(student.id),
        exists: student.exists
      });
      setShowModal(true);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message.includes('PersonNotFound') 
        ? 'Student not found' 
        : 'Failed to search student: ' + error.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!isAdmin) {
      toast.warning('Only admin can remove students');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      
      const tx = await contract.removeStudent(studentId);
      toast.info('Removing student...', { autoClose: false, toastId: 'removeStudent' });
      
      await tx.wait();
      toast.dismiss('removeStudent');
      toast.success('Student removed successfully!');
      setSelectedStudent(null);
      setShowModal(false);
    } catch (error) {
      console.error('Remove student error:', error);
      toast.error(error.message.includes('NotAdmin') 
        ? 'Only admin can remove students' 
        : 'Failed to remove student: ' + error.message
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Student Management System
          </h1>
          <div className="flex items-center gap-4">
            {isConnected && isAdmin && (
              <span className="text-green-400 text-sm">Admin Access</span>
            )}
            <button
              onClick={connectWallet}
              className={`px-6 py-2 rounded-lg ${
                isConnected 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } transition-all duration-300`}
            >
              {isConnected ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-xl mb-4 text-white">Add New Student</h3>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Student Name"
              className="w-full bg-white/5 border border-white/20 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-400"
            />
            <button 
              onClick={handleAddStudent}
              disabled={!isConnected || !isAdmin || isLoading}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Add Student'}
            </button>
          </div>

          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-xl mb-4 text-white">Search Student</h3>
            <div className="flex gap-4">
              <input
                type="number"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Student ID"
                className="flex-1 bg-white/5 border border-white/20 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-gray-400"
              />
              <button
                onClick={handleSearch}
                disabled={!isConnected || isLoading}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedStudent ? 'Student Details' : 'Add New Student'}
              </h2>
              
              {selectedStudent && (
                <div className="space-y-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-300">Name: <span className="text-white">{selectedStudent.name}</span></p>
                    <p className="text-gray-300">ID: <span className="text-white">{selectedStudent.id}</span></p>
                  </div>
                  
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveStudent(selectedStudent.id)}
                      className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300"
                    >
                      Remove Student
                    </button>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default App;