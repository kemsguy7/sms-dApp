// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StudentRegistry {
    // Error declarations
    error NotAdmin();
    error PersonNotFound(); 
  

    // Events
    event StudentAdded(uint256 indexed id, string name, uint256 studentId);
    event StudentRemoved(uint256 indexed id);

    // Struct definition
    struct Class {
        string name;
        uint256 id;
        bool exists; // Add this field to track if a student exists
    }

    // State variables
    address public admin;
    uint256 private studentsCount;
    uint256 private nextStudentId; // Counter for generating unique student IDs automatically 

    // Mappings
    mapping(uint256 => Class) public students;

    // Constructor
    constructor() {
        admin = msg.sender;
        nextStudentId = 1; // Initialize the student ID counter
    }

    // Modifiers
    modifier onlyAdmin() {
        if(msg.sender != admin) revert NotAdmin();
        _;
    }

    // Main functions
    function addStudent(string memory _name) external onlyAdmin {
        uint256 currentId = nextStudentId;
        nextStudentId++; // Increment the ID counter
        
        studentsCount++;
        students[studentsCount] = Class({
            name: _name,
            id: currentId,
            exists: true
        });

        emit StudentAdded(studentsCount, _name, currentId);
    }

    function removeStudent(uint256 _id) external onlyAdmin {
        if (!students[_id].exists) revert PersonNotFound();
        
        delete students[_id];
        emit StudentRemoved(_id);
    }

    // View functions
    function getStudentById(uint256 _id) external view returns (Class memory) {
        if (!students[_id].exists) revert PersonNotFound();
        return students[_id];
    }
}