// types/teacher.ts

export interface AssignedClass {
    className: string;
    section: string;
}

// Full Teacher interface expected from GET /teachers
export interface Teacher {
    employeeId: string;
    _id: string;
    personal: {
        firstName: string;
        lastName: string;
        gender: 'Male' | 'Female' | 'Other';
        dob: string; // YYYY-MM-DD
    };
    contact: {
        phone: string;
        email: string;
    };
    professional: {
        department: string;
        subjects: string[];
        experienceYears: number;
        qualification: string;
    };
    assignedClasses: AssignedClass[];
    status: 'active' | 'inactive' | 'deleted';
    // Display properties expected to be returned by backend for list view
    attendance: number; 
    workload: number;
}

// Payload for POST /teachers
export interface TeacherCreatePayload {
    personal: { firstName: string; lastName: string; gender: 'Male' | 'Female' | 'Other'; dob: string; };
    contact: { phone: string; email: string; };
    professional: { department: string; subjects: string[]; experienceYears: number; qualification: string; };
    assignedClasses: AssignedClass[];
    role: 'teacher';
    email: string; 
    password: string; 
}

// Payload for PUT /teachers/:id
export interface TeacherUpdateDetailsPayload {
    personal: { firstName: string; lastName: string; gender: 'Male' | 'Female' | 'Other'; dob: string; };
    contact: { phone: string; email: string; };
    professional: { department: string; subjects: string[]; experienceYears: number; qualification: string; };
}