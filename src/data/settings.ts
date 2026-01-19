// data/settings.ts
export const planFeatures = {
    basic: ['Up to 500 students', 'Basic AI Insights', 'Email Support', 'Standard Modules'],
    professional: ['Up to 2000 students', 'Advanced Analytics', 'Priority Support', 'Custom Reports'],
    enterprise: ['Unlimited Students', 'Full AI Suite', '24/7 Support', 'API Access', 'White Label']
  };
  
  export const defaultSettings = {
    schoolInfo: {
      name: 'Silver Sand International School',
      code: 'SSIS-2024-001',
      email: 'info@silversand.edu',
      phone: '+91 11 2654 9876',
      address: '123 Knowledge Park, Sector 62, Noida, Uttar Pradesh - 201309',
      established: '2005',
      principal: 'Dr. Ramesh Kumar',
      board: 'CBSE',
      medium: 'English',
      website: 'https://silversand.edu',
      logo: null,
      motto: 'Excellence Through Innovation'
    },
    academicYear: {
      current: '2024-25',
      startDate: '2024-04-01',
      endDate: '2025-03-31',
      terms: 2,
      sessions: ['April-September', 'October-March']
    },
    notifications: [
      { id: 1, name: 'Attendance Alerts', channels: ['email', 'sms', 'whatsapp'], enabled: true },
      { id: 2, name: 'Fee Reminders', channels: ['email', 'sms'], enabled: true },
      { id: 3, name: 'Exam Notifications', channels: ['email', 'whatsapp'], enabled: true },
      { id: 4, name: 'AI Insights', channels: ['email'], enabled: true },
      { id: 5, name: 'Emergency Alerts', channels: ['sms', 'whatsapp', 'voice'], enabled: true },
      { id: 6, name: 'Parent-Teacher Meetings', channels: ['email', 'whatsapp'], enabled: true },
      { id: 7, name: 'Library Reminders', channels: ['email'], enabled: false },
      { id: 8, name: 'Transport Updates', channels: ['whatsapp', 'sms'], enabled: true }
    ],
    billing: {
      plan: 'Enterprise Plan',
      status: 'active',
      price: '₹24,999',
      period: 'month',
      nextBilling: '2025-01-01',
      students: 1248,
      staff: 45,
      storage: '250 GB',
      aiCredits: 'Unlimited',
      features: [
        'Unlimited Students',
        'Advanced AI Analytics',
        'Priority Support',
        'Custom Modules',
        'API Access',
        'White Labeling',
        '99.9% Uptime SLA'
      ]
    },
    security: {
      twoFactor: true,
      lastLogin: '2024-12-15T10:30:00',
      ipWhitelist: ['192.168.1.0/24', '10.0.0.0/16'],
      sessionTimeout: 30,
      passwordAge: 90,
      failedAttempts: 3,
      apiKey: 'sk_live_ssis_2024_9876543210abcdef'
    }
  };