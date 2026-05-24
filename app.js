// Local Database Seeding & Initialization
const defaultJobs = [
    {
        id: "job-1",
        title: "Frontend Developer (React)",
        category: "Teknologi",
        location: "Jakarta (Hybrid)",
        type: "Full-time",
        salary: "Rp 8.000.000 - Rp 12.000.000",
        description: "Kami mencari Frontend Developer yang berpengalaman dengan React.js dan Tailwind CSS untuk membangun antarmuka web yang responsif.",
        status: "active",
        createdAt: "2026-05-20"
    },
    {
        id: "job-2",
        title: "UI/UX Designer",
        category: "Desain",
        location: "Remote",
        type: "Part-time",
        salary: "Rp 4.000.000 - Rp 6.000.000",
        description: "Dibutuhkan UI/UX designer kreatif untuk membuat wireframe, mockup, dan merancang pengalaman pengguna aplikasi mobile kami.",
        status: "active",
        createdAt: "2026-05-22"
    },
    {
        id: "job-3",
        title: "Digital Marketing Intern",
        category: "Pemasaran",
        location: "Bandung",
        type: "Internship",
        salary: "Rp 2.000.000",
        description: "Program magang untuk mengelola media sosial, membuat konten kreatif, dan menganalisis kampanye pemasaran digital.",
        status: "active",
        createdAt: "2026-05-23"
    }
];

const defaultUsers = [
    {
        name: "Budi HRD",
        email: "hr@recruitment.com",
        password: "password123",
        role: "HR"
    },
    {
        name: "Rezky Pelamar",
        email: "pelamar@gmail.com",
        password: "password123",
        role: "Pelamar",
        cvName: "CV_Rezky_Utama.pdf",
        cvData: "data:application/pdf;base64,JVBERi0xLjQKJ..." // Mock PDF Base64
    }
];

const defaultApplications = [
    {
        id: "app-1",
        jobId: "job-1",
        jobTitle: "Frontend Developer (React)",
        applicantEmail: "pelamar@gmail.com",
        applicantName: "Rezky Pelamar",
        cvName: "CV_Rezky_Utama.pdf",
        status: "Applied",
        appliedAt: "2026-05-24 10:30"
    }
];

// Initialize LocalStorage Data
if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify(defaultUsers));
}
if (!localStorage.getItem("jobs")) {
    localStorage.setItem("jobs", JSON.stringify(defaultJobs));
}
if (!localStorage.getItem("applications")) {
    localStorage.setItem("applications", JSON.stringify(defaultApplications));
}

// Database Helpers
const db = {
    getUsers: () => JSON.parse(localStorage.getItem("users")),
    saveUsers: (users) => localStorage.setItem("users", JSON.stringify(users)),
    
    getJobs: () => JSON.parse(localStorage.getItem("jobs")),
    saveJobs: (jobs) => localStorage.setItem("jobs", JSON.stringify(jobs)),
    
    getApplications: () => JSON.parse(localStorage.getItem("applications")),
    saveApplications: (apps) => localStorage.setItem("applications", JSON.stringify(apps)),
    
    getCurrentUser: () => JSON.parse(localStorage.getItem("currentUser")),
    setCurrentUser: (user) => localStorage.setItem("currentUser", JSON.stringify(user)),
    clearCurrentUser: () => localStorage.removeItem("currentUser")
};

// --- AUTHENTICATION MODULE ---
function registerUser(name, email, password, role) {
    const users = db.getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, message: "Email sudah terdaftar!" };
    }
    
    const newUser = { name, email, password, role };
    users.push(newUser);
    db.saveUsers(users);
    return { success: true, message: "Pendaftaran berhasil!" };
}

function loginUser(email, password) {
    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (!user) {
        return { success: false, message: "Email atau password salah!" };
    }
    
    db.setCurrentUser(user);
    return { success: true, user };
}

function logoutUser() {
    db.clearCurrentUser();
    window.location.href = "index.html";
}

// --- JOB CRUD MODULE ---
function createJob(title, category, location, type, salary, description) {
    const jobs = db.getJobs();
    const newJob = {
        id: "job-" + Date.now(),
        title,
        category,
        location,
        type,
        salary,
        description,
        status: "active",
        createdAt: new Date().toISOString().split('T')[0]
    };
    jobs.unshift(newJob); // Add to the top
    db.saveJobs(jobs);
    return newJob;
}

function updateJob(id, updatedFields) {
    const jobs = db.getJobs();
    const index = jobs.findIndex(j => j.id === id);
    if (index !== -1) {
        jobs[index] = { ...jobs[index], ...updatedFields };
        db.saveJobs(jobs);
        return true;
    }
    return false;
}

function deleteJob(id) {
    const jobs = db.getJobs();
    const filteredJobs = jobs.filter(j => j.id !== id);
    db.saveJobs(filteredJobs);
    
    // Also remove applications associated with this job
    const apps = db.getApplications();
    const filteredApps = apps.filter(a => a.jobId !== id);
    db.saveApplications(filteredApps);
}

// --- APPLICATION MODULE ---
function applyForJob(jobId, jobTitle, cvFile) {
    const currentUser = db.getCurrentUser();
    if (!currentUser || currentUser.role !== "Pelamar") {
        return { success: false, message: "Anda harus login sebagai Pelamar!" };
    }

    const apps = db.getApplications();
    // Check if already applied
    const alreadyApplied = apps.find(a => a.jobId === jobId && a.applicantEmail === currentUser.email);
    if (alreadyApplied) {
        return { success: false, message: "Anda sudah melamar pekerjaan ini!" };
    }

    // Helper to read file as base64 (simulation)
    const newApp = {
        id: "app-" + Date.now(),
        jobId,
        jobTitle,
        applicantEmail: currentUser.email,
        applicantName: currentUser.name,
        cvName: cvFile.name,
        status: "Applied",
        appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    apps.unshift(newApp);
    db.saveApplications(apps);

    // Save CV to user profile in users list
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    if (userIndex !== -1) {
        users[userIndex].cvName = cvFile.name;
        db.saveUsers(users);
        
        // Update current session user data
        currentUser.cvName = cvFile.name;
        db.setCurrentUser(currentUser);
    }

    return { success: true, message: "Lamaran Anda berhasil dikirim!" };
}

function updateApplicationStatus(appId, newStatus) {
    const apps = db.getApplications();
    const index = apps.findIndex(a => a.id === appId);
    if (index !== -1) {
        apps[index].status = newStatus;
        db.saveApplications(apps);
        return true;
    }
    return false;
}

// --- FILE VALIDATOR ---
function validateCVFile(file) {
    if (!file) return { valid: false, message: "Pilih file CV terlebih dahulu." };
    
    // Validate Extension (.pdf only)
    const fileName = file.name;
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    if (extension !== '.pdf') {
        return { valid: false, message: "Hanya menerima berkas berformat PDF (.pdf)!" };
    }
    
    // Validate Size (Limit: 2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        return { valid: false, message: "Ukuran berkas melebihi batas maksimal 2MB!" };
    }
    
    return { valid: true };
}
