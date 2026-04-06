/**
 * Notification service for sending reminders and alerts
 */
import { getStoredToken } from '@/lib/auth/storage';

export interface NotificationRequest {
    type: 'payment_reminder' | 'receipt' | 'overdue_alert' | 'payment_confirmation';
    recipientEmail: string;
    recipientPhone?: string;
    studentName: string;
    amount?: number;
    dueDate?: string;
    customMessage?: string;
    templateId?: string;
  }
  
  export interface NotificationResponse {
    success: boolean;
    messageId?: string;
    error?: string;
  }
  
  export interface ReminderTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    daysBeforeDue: number;
    isActive: boolean;
  }
  
  class NotificationService {
    private baseUrl: string;
    
    constructor(baseUrl: string = '/api/notifications') {
      this.baseUrl = baseUrl;
    }
    
    /**
     * Send a single notification
     */
    async sendNotification(request: NotificationRequest): Promise<NotificationResponse> {
      try {
        const response = await fetch(`${this.baseUrl}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify(request)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to send notification');
        }
        
        const data = await response.json();
        return {
          success: true,
          messageId: data.messageId
        };
      } catch (error) {
        console.error('Error sending notification:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send notification'
        };
      }
    }
    
    /**
     * Send bulk reminders to defaulters
     */
    async sendBulkReminders(defaulters: Array<{
      studentName: string;
      parentEmail: string;
      parentPhone?: string;
      amountDue: number;
      dueDate: string;
      daysOverdue: number;
    }>): Promise<{
      success: boolean;
      sent: number;
      failed: number;
      errors: Array<{ email: string; error: string }>;
    }> {
      try {
        const response = await fetch(`${this.baseUrl}/reminders/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({ defaulters })
        });
        
        if (!response.ok) {
          throw new Error('Failed to send bulk reminders');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error sending bulk reminders:', error);
        return {
          success: false,
          sent: 0,
          failed: defaulters.length,
          errors: defaulters.map(d => ({
            email: d.parentEmail,
            error: 'Network error'
          }))
        };
      }
    }
    
    /**
     * Get notification templates
     */
    async getTemplates(): Promise<ReminderTemplate[]> {
      try {
        const response = await fetch(`${this.baseUrl}/templates`, {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
    }
    
    /**
     * Create or update a template
     */
    async saveTemplate(template: ReminderTemplate): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseUrl}/templates`, {
          method: template.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify(template)
        });
        
        if (!response.ok) {
          throw new Error('Failed to save template');
        }
        
        return true;
      } catch (error) {
        console.error('Error saving template:', error);
        return false;
      }
    }
    
    /**
     * Get notification history
     */
    async getNotificationHistory(
      limit: number = 50,
      offset: number = 0
    ): Promise<{
      notifications: Array<{
        id: string;
        type: string;
        recipientEmail: string;
        studentName: string;
        sentAt: string;
        status: 'sent' | 'failed' | 'delivered';
      }>;
      total: number;
    }> {
      try {
        const response = await fetch(
          `${this.baseUrl}/history?limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${this.getAuthToken()}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch notification history');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching notification history:', error);
        return {
          notifications: [],
          total: 0
        };
      }
    }
    
    /**
     * Schedule automated reminders
     */
    async scheduleReminders(daysBeforeDue: number[]): Promise<boolean> {
      try {
        const response = await fetch(`${this.baseUrl}/reminders/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify({ daysBeforeDue })
        });
        
        if (!response.ok) {
          throw new Error('Failed to schedule reminders');
        }
        
        return true;
      } catch (error) {
        console.error('Error scheduling reminders:', error);
        return false;
      }
    }
    
    private getAuthToken(): string {
      return getStoredToken() || '';
    }
  }
  
  export const notificationService = new NotificationService();
