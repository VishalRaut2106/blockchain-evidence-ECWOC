// Supabase Storage - Free PostgreSQL Database
class SupabaseStorage {
    constructor() {
        // Supabase config (free tier - 500MB database, 1GB bandwidth/month)
        this.supabaseUrl = 'https://vkqswulxmuuganmjqumb.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcXN3dWx4bXV1Z2FubWpxdW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3ODc3OTQsImV4cCI6MjA4MjM2Mzc5NH0.LsZKX2aThok0APCNXr9yQ8FnuJnIw6v8RsTIxVLFB4U';
        this.apiUrl = `${this.supabaseUrl}/rest/v1`;
        this.init();
    }

    async init() {
        console.log('Supabase Storage initialized - Free PostgreSQL database');
    }

    // Headers for API requests
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`
        };
    }

    // Save user data
    async saveUser(userData) {
        try {
            const userRecord = {
                wallet_address: userData.walletAddress,
                full_name: userData.fullName,
                role: userData.role,
                department: userData.department || 'Public',
                badge_number: userData.badgeNumber || '',
                jurisdiction: userData.jurisdiction || 'Public',
                registration_date: new Date().toISOString(),
                last_updated: new Date().toISOString(),
                is_active: true
            };

            const response = await fetch(`${this.apiUrl}/users`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(userRecord)
            });

            if (response.ok) {
                console.log('User saved to Supabase');
                await this.logActivity(userData.walletAddress, 'USER_REGISTERED', 'User registered successfully');
                return true;
            } else {
                throw new Error('Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            // Fallback to localStorage
            localStorage.setItem('evidUser_' + userData.walletAddress, JSON.stringify(userData));
            return false;
        }
    }

    // Get user data
    async getUser(walletAddress) {
        try {
            const response = await fetch(`${this.apiUrl}/users?wallet_address=eq.${walletAddress}`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const users = await response.json();
                if (users.length > 0) {
                    return users[0];
                }
            }

            // Fallback to localStorage
            const localData = localStorage.getItem('evidUser_' + walletAddress);
            if (localData) {
                const userData = JSON.parse(localData);
                userData.walletAddress = walletAddress;
                // Try to sync to Supabase
                this.saveUser(userData).catch(console.error);
                return userData;
            }

            return null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    }

    // Save evidence
    async saveEvidence(evidenceData) {
        try {
            const evidenceRecord = {
                case_id: evidenceData.caseId,
                title: evidenceData.title,
                description: evidenceData.description,
                type: evidenceData.type,
                file_data: evidenceData.fileData,
                file_name: evidenceData.fileName,
                file_size: evidenceData.fileSize,
                hash: evidenceData.hash,
                submitted_by: evidenceData.submittedBy,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            const response = await fetch(`${this.apiUrl}/evidence`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(evidenceRecord)
            });

            if (response.ok) {
                const result = await response.json();
                const evidenceId = result[0].id;
                await this.logActivity(evidenceData.submittedBy, 'EVIDENCE_SUBMITTED', `Evidence submitted: ${evidenceData.title}`);
                console.log('Evidence saved to Supabase');
                return evidenceId;
            } else {
                throw new Error('Failed to save evidence');
            }
        } catch (error) {
            console.error('Error saving evidence:', error);
            throw error;
        }
    }

    // Get evidence by ID
    async getEvidence(evidenceId) {
        try {
            const response = await fetch(`${this.apiUrl}/evidence?id=eq.${evidenceId}`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const evidence = await response.json();
                return evidence.length > 0 ? evidence[0] : null;
            }

            return null;
        } catch (error) {
            console.error('Error getting evidence:', error);
            return null;
        }
    }

    // Get all evidence
    async getAllEvidence() {
        try {
            const response = await fetch(`${this.apiUrl}/evidence?order=timestamp.desc`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const evidence = await response.json();
                return evidence;
            }

            return [];
        } catch (error) {
            console.error('Error getting all evidence:', error);
            return [];
        }
    }

    // Save case
    async saveCase(caseData) {
        try {
            const caseRecord = {
                title: caseData.title,
                description: caseData.description,
                priority: caseData.priority,
                created_by: caseData.createdBy,
                assigned_to: caseData.assignedTo,
                status: 'open',
                created_date: new Date().toISOString(),
                last_modified: new Date().toISOString()
            };

            const response = await fetch(`${this.apiUrl}/cases`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(caseRecord)
            });

            if (response.ok) {
                const result = await response.json();
                const caseId = result[0].id;
                await this.logActivity(caseData.createdBy, 'CASE_CREATED', `Case created: ${caseData.title}`);
                console.log('Case saved to Supabase');
                return caseId;
            } else {
                throw new Error('Failed to save case');
            }
        } catch (error) {
            console.error('Error saving case:', error);
            throw error;
        }
    }

    // Get all cases
    async getAllCases() {
        try {
            const response = await fetch(`${this.apiUrl}/cases?order=created_date.desc`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const cases = await response.json();
                return cases;
            }

            return [];
        } catch (error) {
            console.error('Error getting cases:', error);
            return [];
        }
    }

    // Log activity
    async logActivity(userId, action, details) {
        try {
            const logRecord = {
                user_id: userId,
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                ip_address: await this.getClientIP()
            };

            await fetch(`${this.apiUrl}/activity_logs`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(logRecord)
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    // Get activity logs
    async getActivityLogs(userId = null, limit = 100) {
        try {
            let url = `${this.apiUrl}/activity_logs?order=timestamp.desc&limit=${limit}`;
            if (userId) {
                url += `&user_id=eq.${userId}`;
            }

            const response = await fetch(url, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const logs = await response.json();
                return logs;
            }

            return [];
        } catch (error) {
            console.error('Error getting activity logs:', error);
            return [];
        }
    }

    // Utility functions
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // File handling
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Generate hash for integrity
    async generateHash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Export all data
    async exportAllData() {
        try {
            const [users, evidence, cases, logs] = await Promise.all([
                this.getAllUsers(),
                this.getAllEvidence(),
                this.getAllCases(),
                this.getActivityLogs()
            ]);

            const exportData = {
                timestamp: new Date().toISOString(),
                users: users,
                evidence: evidence,
                cases: cases,
                logs: logs
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Get all users (admin function)
    async getAllUsers() {
        try {
            const response = await fetch(`${this.apiUrl}/users`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                return await response.json();
            }

            return [];
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    }
}

// Initialize Supabase storage
const supabaseStorage = new SupabaseStorage();

// Use Supabase as the main storage
window.storage = supabaseStorage;