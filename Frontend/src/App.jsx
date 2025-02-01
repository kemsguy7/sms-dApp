import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import abi from './abi.json'

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

  // const checkIfAdmin = async (address) => {
  //   try {
  //     const provider = new ethers.BrowserProvider(window.ethereum);
  //     const contract = new ethers.Contract(contractAddress, abi, provider);
  //     const adminAddress = await contract.admin();
  //     setIsAdmin(adminAddress.toLowerCase() === address.toLowerCase());
  //   } catch (error) {
  //     console.error('Error checking admin status:', error);
  //     setIsAdmin(false);
  //   }
  // };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-8 px-4 flex flex-col justify-center">
      <div className="w-full max-w-4xl mx-auto">
        {/* Main Container with Neumorphic Design */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-[20px_20px_60px_rgba(0,0,0,0.5),-20px_-20px_60px_rgba(255,255,255,0.1)] 
                      border border-white/20 overflow-hidden">
          
          {/* Header Section - Stacked Layout */}
          <div className="p-6 md:p-8 border-b border-white/10">
            <div className="flex flex-col items-center space-y-6">
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text 
                         bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                Student Management System
              </h1>
              
              {/* Status Badges Container */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
                {isConnected && isAdmin && (
                  <div className="w-full sm:flex-1 px-6 py-3 bg-green-500/20 text-green-300 
                              rounded-2xl border border-green-500/50 text-center
                              shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.1)]">
                    Admin Access
                  </div>
                )}
                <button
                  onClick={connectWallet}
                  className={`w-full sm:flex-1 px-6 py-3 rounded-2xl transform transition-all duration-300
                          hover:scale-102 active:scale-98 ${
                    isConnected 
                      ? 'bg-white/10 text-white border border-white/20 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1)]' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  }`}
                >
                  {isConnected ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Add Student Section */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/20 
                        shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)]
                        transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-6">Add New Student</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Student Name"
                  className="w-full bg-white/5 border border-white/20 p-4 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50
                           text-white placeholder:text-gray-400
                           shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]"
                />
                <button 
                  onClick={handleAddStudent}
                  disabled={!isConnected || !isAdmin || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white
                           px-6 py-4 rounded-xl transform transition-all duration-300
                           hover:scale-102 active:scale-98 disabled:opacity-50 
                           disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]"
                >
                  {isLoading ? 'Processing...' : 'Add Student'}
                </button>
              </div>
            </div> 

            {/* Search Section */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/20 
                        shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)]
                        transition-all duration-300">
              <h3 className="text-xl font-semibold text-white mb-6">Search Student</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="number"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Student ID"
                  className="w-full bg-white/5 border border-white/20 p-4 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50
                           text-white placeholder:text-gray-400
                           shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)]"
                />
                <button
                  onClick={handleSearch}
                  disabled={!isConnected || isLoading}
                  className="w-full sm:w-auto sm:min-w-[120px] bg-gradient-to-r from-indigo-600 to-blue-600
                           text-white px-8 py-4 rounded-xl transform transition-all
                           duration-300 hover:scale-102 active:scale-98 disabled:opacity-50
                           disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal - Improved Neumorphic Design */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800/90 p-8 rounded-3xl max-w-md w-full
                        border border-white/20 
                        shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.1)]
                        transform transition-all duration-300">
              <h2 className="text-2xl font-bold text-white mb-6">
                Student Details
              </h2>
              
              {selectedStudent && (
                <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10
                               shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)]">
                    <p className="text-gray-300 mb-3">Name: 
                      <span className="text-white ml-2 font-medium">{selectedStudent.name}</span>
                    </p>
                    <p className="text-gray-300">ID: 
                      <span className="text-white ml-2 font-medium">{selectedStudent.id}</span>
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveStudent(selectedStudent.id)}
                      className="w-full bg-gradient-to-r from-red-600 to-pink-600
                               text-white px-6 py-4 rounded-xl transform
                               transition-all duration-300 hover:scale-102 active:scale-98
                               shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]"
                    >
                      Remove Student
                    </button>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowModal(false)}
                className="mt-6 w-full bg-white/10 text-white px-6 py-4 rounded-xl
                         hover:bg-white/20 transform transition-all duration-300
                         hover:scale-102 active:scale-98
                         shadow-[4px_4px_8px_rgba(0,0,0,0.3),-4px_-4px_8px_rgba(255,255,255,0.1)]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="toast-container"
      />
    </div>
  );
}

export default App;
