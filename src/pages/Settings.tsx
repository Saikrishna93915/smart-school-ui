// app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  School,
  Calendar,
  CreditCard,
  Bell,
  Shield,
  Upload,
  Save,
  Settings as SettingsIcon,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  Lock,
  Database,
  Cloud,
  Cpu,
  Zap,
  Eye,
  EyeOff,
  Key,
  UserPlus,
  RefreshCw,
  Download,
  Upload as UploadIcon,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart,
  FileText,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  ClipboardCheck,
  Target,
  Package,
  Star,
  Award,
  FileCode,
  Network,
  Server,
  HardDrive,
  Wifi,
  Database as DatabaseIcon,
  Shield as ShieldIcon,
  Users as UsersIcon,
  Bell as BellIcon,
  CreditCard as CreditCardIcon,
  School as SchoolIcon,
  Calendar as CalendarIcon,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi, defaultSettings, planFeatures } from '@/Services/settingsService';
import { useAuth } from '@/contexts/AuthContext';

export default function SystemSettings() {
  const authContext = useAuth();
  const user = authContext?.user;
  const userRole = user?.role || 'admin';
  
  const [activeTab, setActiveTab] = useState('school');
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('sk_live_ssis_2024_9876543210abcdef');
  const [backupProgress, setBackupProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for settings data
  const [settings, setSettings] = useState(defaultSettings);
  const [systemHealth, setSystemHealth] = useState<typeof defaultSettings.systemHealth>(defaultSettings.systemHealth);
  const [schoolStats, setSchoolStats] = useState({ totalClasses: 36, totalSubjects: 18, establishedYear: 2005 });

  // Local state for form inputs
  const [schoolData, setSchoolData] = useState(defaultSettings.schoolInfo || {} as any);
  const [academicData, setAcademicData] = useState(defaultSettings.academicYear || {} as any);
  const [notificationSettings, setNotificationSettings] = useState(defaultSettings.notifications || []);

  // Load all settings on mount
  useEffect(() => {
    loadSettings();
    loadSystemHealth();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Fetching settings from backend API...');
      const response = await settingsApi.getAllSettings();
      
      if (response.success && response.data) {
        const data = response.data;
        console.log('✅ Settings received from API:', {
          schoolName: data.schoolInfo?.name,
          academicYear: data.academicYear?.current,
          notificationsCount: data.notifications?.length,
          hasSecurityData: !!data.security
        });
        
        setSettings(data);
        setSchoolData(data.schoolInfo || defaultSettings.schoolInfo || {} as any);
        setAcademicData(data.academicYear || defaultSettings.academicYear || {} as any);
        setNotificationSettings(data.notifications || defaultSettings.notifications || []);
        if (data.security?.apiKey) {
          setApiKey(data.security.apiKey);
        }
        
        // Extract school statistics from mapped schoolInfo data
        // These are already mapped by settingsApi.getAllSettings()
        const stats = (data.schoolInfo as any) || {};
        setSchoolStats({
          totalClasses: stats.totalClasses || 36,
          totalSubjects: stats.totalSubjects || 18,
          establishedYear: stats.established ? parseInt(stats.established) : 2005
        });
        console.log('📊 School statistics loaded:', { 
          totalClasses: stats.totalClasses, 
          totalSubjects: stats.totalSubjects, 
          establishedYear: stats.established 
        });
      } else {
        console.warn('⚠️ API response missing success or data field');
        setSettings(defaultSettings);
      }
    } catch (error: any) {
      console.error('❌ Error loading settings:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('Failed to load settings from backend. Using local defaults.');
      // Use default settings as fallback
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      console.log('📊 Fetching system health from backend...');
      const response = await settingsApi.getSystemHealth();
      if (response.success && response.data) {
        console.log('✅ System health data received');
        setSystemHealth(response.data);
      }
    } catch (error: any) {
      console.error('⚠️ Error loading system health:', error);
      // Keep using default health data
    }
  };

  // Handle save school profile
  const handleSaveSchoolProfile = async () => {
    try {
      setIsSaving(true);
      const response = await settingsApi.updateSchoolProfile(schoolData);
      if (response.success) {
        setSettings(prev => ({ ...prev, schoolInfo: response.data }));
        toast.success('School profile updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating school profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update school profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save academic settings
  const handleSaveAcademicSettings = async () => {
    try {
      setIsSaving(true);
      const response = await settingsApi.updateAcademicSettings(academicData);
      if (response.success) {
        setSettings(prev => ({ ...prev, academicYear: response.data }));
        toast.success('Academic settings updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating academic settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update academic settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save notification settings
  const handleSaveNotificationSettings = async () => {
    try {
      setIsSaving(true);
      const response = await settingsApi.updateNotificationSettings(notificationSettings);
      if (response.success) {
        setSettings(prev => ({ ...prev, notifications: response.data }));
        toast.success('Notification settings updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle toggle notification
  const toggleNotification = (targetKey: string) => {
    const updated = notificationSettings.map((notif, index) => {
      const notifKey = String(notif.id ?? `${notif.name}-${index}`);
      return notifKey === targetKey ? { ...notif, enabled: !notif.enabled } : notif;
    });
    setNotificationSettings(updated);
    toast.success('Notification setting updated');
  };

  // Handle save all changes
  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      let successCount = 0;
      let failCount = 0;

      // Save school profile
      try {
        await settingsApi.updateSchoolProfile(schoolData);
        successCount++;
      } catch (error) {
        console.error('Error saving school profile:', error);
        failCount++;
      }

      // Save academic settings
      try {
        await settingsApi.updateAcademicSettings(academicData);
        successCount++;
      } catch (error) {
        console.error('Error saving academic settings:', error);
        failCount++;
      }

      // Save notification settings
      try {
        await settingsApi.updateNotificationSettings(notificationSettings);
        successCount++;
      } catch (error) {
        console.error('Error saving notification settings:', error);
        failCount++;
      }

      // Reload settings
      await loadSettings();

      if (failCount === 0) {
        toast.success(`✓ All settings saved successfully (${successCount} updated)`);
      } else {
        toast.warning(`⚠ Partially saved: ${successCount} succeeded, ${failCount} failed`);
      }
    } catch (error: any) {
      console.error('Error saving all settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      // Reset input
      event.target.value = '';
      return;
    }

    try {
      setIsLoading(true);
      console.log('📸 Uploading logo:', file.name, file.size, 'bytes');
      const response = await settingsApi.uploadLogo(file);
      console.log('✅ Upload response:', response);
      
      if (response.success && response.data) {
        const logoUrl = response.data.path || response.data.logoUrl;
        console.log('📍 Logo URL:', logoUrl);
        
        // Update local state immediately for UI feedback
        setSchoolData((prev: any) => ({ 
          ...prev, 
          logo: logoUrl 
        }));
        setSettings((prev: any) => ({ 
          ...prev, 
          schoolInfo: { 
            ...prev.schoolInfo, 
            logo: logoUrl 
          } 
        }));
        
        // Reload all settings from backend to verify persistence in database
        console.log('🔄 Reloading settings from backend...');
        await loadSettings();
        
        toast.success('✓ Logo uploaded and saved successfully');
      } else {
        toast.error('Upload response missing data');
      }
    } catch (error: any) {
      console.error('❌ Logo upload error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setIsLoading(false);
      // Reset input so same file can be uploaded again
      event.target.value = '';
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    console.log('🖱️ Click triggered, opening file dialog...');
    fileInputRef.current?.click();
  };

  // Handle backup
  const handleBackup = async () => {
    try {
      setBackupProgress(0);
      const result = await settingsApi.createBackup();
      toast.success(`Backup initiated (ID: ${result.backupId})`);
      
      // Simulate progress for UI feedback
      const interval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            toast.success('Backup completed successfully');
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
    } catch (error: any) {
      console.error('Error creating backup:', error);
      toast.error(error.response?.data?.message || 'Failed to create backup');
    }
  };

  // Handle regenerate API key
  const handleRegenerateKey = async () => {
    try {
      setIsLoading(true);
      const result = await settingsApi.regenerateApiKey();
      setApiKey(result.apiKey);
      toast.success('API key regenerated successfully');
    } catch (error: any) {
      console.error('Error regenerating API key:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate API key');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export
  const handleExport = async (_format: string) => {
    try {
      // Export current settings as JSON
      const exportData = {
        school: schoolData,
        academic: academicData,
        notifications: notificationSettings,
        security: settings.security,
        billing: settings.billing,
        systemHealth: systemHealth,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Settings exported successfully');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error(error.response?.data?.message || 'Failed to export data');
    }
  };

  // Get safe values with fallbacks
  const getSecuritySetting = (key: string) => {
    return (settings.security as Record<string, any>)?.[key] ?? (defaultSettings.security as Record<string, any>)?.[key] ?? '';
  };

  const getBillingSetting = (key: string) => {
    return (settings.billing as Record<string, any>)?.[key] ?? (defaultSettings.billing as Record<string, any>)?.[key] ?? '';
  };

  const getHealthSetting = (key: string) => {
    // use loose indexing at runtime while preserving compile-time keys from defaultSettings
    return (systemHealth as Record<string, any>)?.[key] ?? (defaultSettings.systemHealth as Record<string, any>)?.[key] ?? '';
  };

  const getSchoolStat = (key: string) => {
    return (schoolStats as Record<string, any>)?.[key] ?? '';
  };

  if (isLoading && !settings) {
    return (
      
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
     
    );
  }

  return (
    
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
                <p className="text-muted-foreground">
                  {userRole === 'admin' ? 'Manage system configuration and preferences' :
                   userRole === 'teacher' ? 'Configure your preferences and settings' :
                   'System-wide configuration management'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { loadSettings(); loadSystemHealth(); toast.success('Settings refreshed'); }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleExport('json')}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Config
            </Button>
            <Button 
              size="sm" 
              disabled={isLoading || isSaving}
              onClick={handleSaveAll}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>

        {/* System Health Overview - 6 metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                  <p className="text-2xl font-bold">{getHealthSetting('uptime')}</p>
                </div>
                <div className="p-2 bg-success/10 rounded-lg">
                  <Server className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={parseFloat(getHealthSetting('uptime') as string) || 99.95} className="mt-3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{getHealthSetting('activeUsers')}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Currently online</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Storage Usage</p>
                  <p className="text-2xl font-bold">{getHealthSetting('storage')}</p>
                </div>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <HardDrive className="h-5 w-5 text-warning" />
                </div>
              </div>
              <Progress value={parseFloat(getHealthSetting('storage') as string) || 45} className="mt-3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold">{getHealthSetting('memory')}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <DatabaseIcon className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <Progress value={parseFloat(getHealthSetting('memory') as string) || 68} className="mt-3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CPU Usage</p>
                  <p className="text-2xl font-bold">{getHealthSetting('cpu')}</p>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Cpu className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <Progress value={parseFloat(getHealthSetting('cpu') as string) || 32} className="mt-3" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-2xl font-bold">{getHealthSetting('responseTime')}</p>
                </div>
                <div className="p-2 bg-info/10 rounded-lg">
                  <Zap className="h-5 w-5 text-info" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Average API response</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="school" className="flex items-center gap-2">
              <SchoolIcon className="h-4 w-4" />
              <span className="hidden md:inline">School</span>
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden md:inline">Academic</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <BellIcon className="h-4 w-4" />
              <span className="hidden md:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <ShieldIcon className="h-4 w-4" />
              <span className="hidden md:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4" />
              <span className="hidden md:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden md:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* School Profile Tab */}
          <TabsContent value="school" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <School className="h-5 w-5" />
                          School Profile
                        </CardTitle>
                        <CardDescription>Manage your school's basic information and identity</CardDescription>
                      </div>
                      <Badge variant="outline">ID: {schoolData.code || 'SSIS-2024-001'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo Upload Section */}
                    <div className="flex items-start gap-6">
                      <div className="relative">
                        <div className="h-32 w-32 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/50 flex items-center justify-center overflow-hidden">
                          {schoolData.logo ? (
                            <img 
                              src={schoolData.logo} 
                              alt="School Logo" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="text-center">
                              <School className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                              <p className="text-xs text-muted-foreground">No logo</p>
                            </div>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isLoading}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 w-full" 
                          disabled={isLoading}
                          onClick={triggerFileInput}
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          {isLoading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>School Logo Guidelines</Label>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>• PNG or JPG format</li>
                          <li>• Max file size: 2MB</li>
                          <li>• Recommended: 400x400px</li>
                          <li>• Transparent background preferred</li>
                        </ul>
                      </div>
                    </div>

                    {/* School Information Form */}
                    <div className="grid gap-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="schoolName" className="flex items-center gap-2">
                            <School className="h-3 w-3" />
                            School Name *
                          </Label>
                          <Input 
                            id="schoolName" 
                            value={schoolData.name || ''}
                            onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="schoolCode" className="flex items-center gap-2">
                            <FileCode className="h-3 w-3" />
                            School Code
                          </Label>
                          <Input 
                            id="schoolCode" 
                            value={schoolData.code || ''}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">Auto-generated, cannot be changed</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            Email Address *
                          </Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={schoolData.email || ''}
                            onChange={(e) => setSchoolData({...schoolData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            Phone Number *
                          </Label>
                          <Input 
                            id="phone" 
                            value={schoolData.phone || ''}
                            onChange={(e) => setSchoolData({...schoolData, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          Complete Address *
                        </Label>
                        <Textarea 
                          id="address" 
                          rows={2}
                          value={schoolData.address || ''}
                          onChange={(e) => setSchoolData({...schoolData, address: e.target.value})}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="website" className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            Website
                          </Label>
                          <Input 
                            id="website" 
                            value={schoolData.website || ''}
                            onChange={(e) => setSchoolData({...schoolData, website: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="motto" className="flex items-center gap-2">
                            <Award className="h-3 w-3" />
                            School Motto
                          </Label>
                          <Input 
                            id="motto" 
                            value={schoolData.motto || ''}
                            onChange={(e) => setSchoolData({...schoolData, motto: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="established" className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Year Established
                          </Label>
                          <Input 
                            id="established" 
                            value={schoolData.established || ''}
                            onChange={(e) => setSchoolData({...schoolData, established: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="principal" className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Principal Name
                          </Label>
                          <Input 
                            id="principal" 
                            value={schoolData.principal || ''}
                            onChange={(e) => setSchoolData({...schoolData, principal: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setSchoolData(settings.schoolInfo || defaultSettings.schoolInfo || {} as any)}
                      disabled={isLoading}
                    >
                      Reset Changes
                    </Button>
                    <Button 
                      onClick={handleSaveSchoolProfile} 
                      disabled={isLoading || isSaving}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              {/* Right Side - Quick Stats & Actions */}
              <div className="space-y-6">
                {/* School Statistics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      School Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Students</span>
                        <span className="font-semibold">{getBillingSetting('students')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Staff Members</span>
                        <span className="font-semibold">{getBillingSetting('staff')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Active Classes</span>
                        <span className="font-semibold">{getSchoolStat('totalClasses')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Subjects Offered</span>
                        <span className="font-semibold">{getSchoolStat('totalSubjects')}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">System Active Since</span>
                        <span className="text-sm">{getSchoolStat('establishedYear')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleExport('csv')}
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export School Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled={isLoading}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage User Roles
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled={isLoading}>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Reports
                    </Button>
                  </CardContent>
                </Card>

                {/* Status Badge */}
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold">Profile Complete</p>
                        <p className="text-sm text-muted-foreground">All required information is provided</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Academic Settings Tab */}
          <TabsContent value="academic" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Academic Year Configuration</CardTitle>
                      <CardDescription>Configure current academic session and terms</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Current Academic Year *
                      </Label>
                      <Select 
                        value={academicData.current || '2024-2025'}
                        onValueChange={(value) => setAcademicData({...academicData, current: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2024-2025">2024-2025</SelectItem>
                          <SelectItem value="2023-2024">2023-2024</SelectItem>
                          <SelectItem value="2022-2023">2022-2023</SelectItem>
                          <SelectItem value="2021-2022">2021-2022</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Terms</Label>
                      <Input 
                        type="number" 
                        value={academicData.terms || 2}
                        onChange={(e) => setAcademicData({...academicData, terms: parseInt(e.target.value) || 2})}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Session Start Date *</Label>
                      <Input 
                        type="date" 
                        value={academicData.startDate || ''}
                        onChange={(e) => setAcademicData({...academicData, startDate: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Session End Date *</Label>
                      <Input 
                        type="date" 
                        value={academicData.endDate || ''}
                        onChange={(e) => setAcademicData({...academicData, endDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Academic Sessions</Label>
                    <div className="space-y-2">
                      {(academicData.sessions || []).map((session: string, index: number) => (
                        <div key={index} className="flex items-center gap-3">
                          <Input 
                            value={session}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newSessions: string[] = [...(academicData.sessions || [])];
                              newSessions[index] = e.target.value;
                              setAcademicData({ ...academicData, sessions: newSessions });
                            }}
                          />
                          {(academicData.sessions || []).length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newSessions: string[] = (academicData.sessions || []).filter((_: string, i: number) => i !== index);
                                setAcademicData({ ...academicData, sessions: newSessions });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAcademicData({
                        ...academicData, 
                        sessions: [...(academicData.sessions || []), 'New Session']
                      })}
                    >
                      Add Session
                    </Button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleSaveAcademicSettings}
                    disabled={isLoading || isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Update Academic Calendar'}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Board & Curriculum</CardTitle>
                      <CardDescription>Select education board and curriculum settings</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        Education Board *
                      </Label>
                      <Select 
                        value={schoolData.board || 'CBSE'}
                        onValueChange={(value) => setSchoolData({...schoolData, board: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CBSE">CBSE (Central Board)</SelectItem>
                          <SelectItem value="ICSE">ICSE (Council)</SelectItem>
                          <SelectItem value="State">State Board</SelectItem>
                          <SelectItem value="IB">IB (International)</SelectItem>
                          <SelectItem value="IGCSE">IGCSE (Cambridge)</SelectItem>
                          <SelectItem value="NIOS">NIOS (Open Schooling)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3" />
                        Medium of Instruction *
                      </Label>
                      <Select 
                        value={schoolData.medium || 'English'}
                        onValueChange={(value) => setSchoolData({...schoolData, medium: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Hindi">Hindi</SelectItem>
                          <SelectItem value="Both">Both English & Hindi</SelectItem>
                          <SelectItem value="Regional">Regional Language</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        Grading System
                      </Label>
                      <Select defaultValue="percentage">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="cgpa">CGPA (10-point)</SelectItem>
                          <SelectItem value="letter">Letter Grades</SelectItem>
                          <SelectItem value="both">Both % & CGPA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Class Duration
                      </Label>
                      <Select defaultValue="45">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="40">40 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="50">50 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Important Notes
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Changing board may affect existing curriculum</li>
                      <li>• Academic year cannot be changed once active</li>
                      <li>• Contact support for major curriculum changes</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Configure how notifications are sent and received</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allEnabled = notificationSettings.map(n => ({ ...n, enabled: true }));
                        setNotificationSettings(allEnabled);
                      }}
                    >
                      Enable All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const allDisabled = notificationSettings.map(n => ({ ...n, enabled: false }));
                        setNotificationSettings(allDisabled);
                      }}
                    >
                      Disable All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {notificationSettings.map((item, index) => (
                    <div key={item.id ?? `${item.name}-${index}`} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base">{item.name}</Label>
                        <div className="flex items-center gap-2">
                          {item.channels.map((channel, channelIndex) => (
                            <Badge key={`${item.name}-${channel}-${channelIndex}`} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Switch 
                        checked={item.enabled}
                        onCheckedChange={() => toggleNotification(String(item.id ?? `${item.name}-${index}`))}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Channel Configuration */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Channel Configuration</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Notifications
                        </Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Daily Digest</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Instant Alerts</span>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          WhatsApp
                        </Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Emergency Only</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Group Messages</span>
                          <Switch />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          SMS Alerts
                        </Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2 pl-6">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Fee Reminders</span>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Attendance Alerts</span>
                          <Switch />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={handleSaveNotificationSettings}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Update Notification Settings'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>Configure system security and access controls</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                      <Switch defaultChecked={getSecuritySetting('twoFactor') as boolean} />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Session Timeout (minutes)
                      </Label>
                      <Input 
                        type="number" 
                        defaultValue={getSecuritySetting('sessionTimeout') as number}
                      />
                      <p className="text-xs text-muted-foreground">Time before automatic logout</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Password Policy
                      </Label>
                      <Select defaultValue="90">
                        <SelectTrigger>
                          <SelectValue placeholder="Password expiration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="never">Never expire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Failed Login Attempts
                      </Label>
                      <Input 
                        type="number" 
                        defaultValue={getSecuritySetting('failedAttempts') as number}
                      />
                      <p className="text-xs text-muted-foreground">Lock account after failed attempts</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        IP Whitelist
                      </Label>
                      <Textarea 
                        placeholder="Enter IP addresses (one per line)"
                        rows={3}
                        defaultValue={(settings.security?.ipWhitelist || defaultSettings.security?.ipWhitelist || []).join('\n')}
                      />
                      <p className="text-xs text-muted-foreground">Allow access only from these IPs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>API & Integration</CardTitle>
                      <CardDescription>Manage API keys and external integrations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        API Key
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input 
                            type={showApiKey ? "text" : "password"} 
                            value={apiKey}
                            readOnly
                            className="pr-10 font-mono text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button variant="outline" onClick={handleRegenerateKey} disabled={isLoading}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Keep this key secret. It provides full access to your account.</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Allowed Domains
                      </Label>
                      <Textarea 
                        placeholder="https://yourdomain.com"
                        rows={2}
                        defaultValue="https://silversand.edu"
                      />
                      <p className="text-xs text-muted-foreground">CORS allowed origins for API access</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Rate Limiting
                      </Label>
                      <Select defaultValue="100">
                        <SelectTrigger>
                          <SelectValue placeholder="Requests per minute" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 requests/min</SelectItem>
                          <SelectItem value="50">50 requests/min</SelectItem>
                          <SelectItem value="100">100 requests/min</SelectItem>
                          <SelectItem value="500">500 requests/min</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Security Warning
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Never share your API key publicly</li>
                        <li>• Regenerate keys if compromised</li>
                        <li>• Monitor API usage regularly</li>
                        <li>• Use HTTPS for all API calls</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="destructive" className="w-full" disabled={isLoading}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Run Security Audit
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Subscription & Billing</CardTitle>
                      <CardDescription>Manage your plan, payments, and invoices</CardDescription>
                    </div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/20">
                        <Package className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-bold">{getBillingSetting('plan')}</h3>
                          <Badge variant="success" className="text-sm">
                            Current Plan
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          Includes all premium features and priority support
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{getBillingSetting('price')}
                        <span className="text-lg font-normal text-muted-foreground">/{getBillingSetting('period')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Next billing: {getBillingSetting('nextBilling') ? 
                          new Date(getBillingSetting('nextBilling') as string).toLocaleDateString() : 
                          '2025-01-01'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{getBillingSetting('students')}</p>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 mb-3">
                      <UserPlus className="h-6 w-6 text-secondary" />
                    </div>
                    <p className="text-2xl font-bold">{getBillingSetting('staff')}</p>
                    <p className="text-sm text-muted-foreground">Staff Accounts</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
                      <Database className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-2xl font-bold">{getBillingSetting('storage')}</p>
                    <p className="text-sm text-muted-foreground">Storage Used</p>
                  </div>
                </div>

                {/* Feature Comparison */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Plan Comparison</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(planFeatures).map(([plan, features]) => (
                      <div key={plan} className={`p-4 border rounded-lg ${plan === 'enterprise' ? 'border-primary ring-1 ring-primary' : ''}`}>
                        <h5 className="font-semibold capitalize mb-3">{plan} Plan</h5>
                        <ul className="space-y-2">
                          {features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-success" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        {plan === 'enterprise' && (
                          <Button className="w-full mt-4" size="sm" disabled={isLoading}>
                            Current Plan
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" disabled={isLoading}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Invoices
                  </Button>
                  <Button variant="outline" disabled={isLoading}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipts
                  </Button>
                  <Button variant="outline" disabled={isLoading}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Update Payment Method
                  </Button>
                  <Button disabled={isLoading}>
                    <Star className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Database Management</CardTitle>
                      <CardDescription>Manage backups, exports, and data operations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <DatabaseIcon className="h-4 w-4" />
                        Automatic Backups
                      </Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Manual Backup
                      </Label>
                      <div className="space-y-3">
                        {backupProgress > 0 && backupProgress < 100 && (
                          <div className="space-y-2">
                            <Progress value={backupProgress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">
                              Backup in progress... {backupProgress}%
                            </p>
                          </div>
                        )}
                        <Button onClick={handleBackup} disabled={isLoading || (backupProgress > 0 && backupProgress < 100)}>
                          <Database className="h-4 w-4 mr-2" />
                          {backupProgress > 0 ? 'Backing up...' : 'Create Backup Now'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <UploadIcon className="h-4 w-4" />
                        Data Export
                      </Label>
                      <Select defaultValue="csv">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV Format</SelectItem>
                          <SelectItem value="excel">Excel Format</SelectItem>
                          <SelectItem value="json">JSON Format</SelectItem>
                          <SelectItem value="pdf">PDF Reports</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => handleExport('csv')}
                        disabled={isLoading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Important Notice
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Backups are encrypted for security</li>
                      <li>• Large exports may take several minutes</li>
                      <li>• Keep backup files in secure location</li>
                      <li>• Regular backups are recommended</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>System Configuration</CardTitle>
                      <CardDescription>Advanced system settings and preferences</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">Temporarily disable system access</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Error Reporting</Label>
                        <p className="text-sm text-muted-foreground">Send error reports to developers</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Analytics Tracking</Label>
                        <p className="text-sm text-muted-foreground">Help improve the system</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        CDN Configuration
                      </Label>
                      <Input placeholder="https://cdn.yourdomain.com" />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Cache Duration
                      </Label>
                      <Select defaultValue="3600">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="300">5 minutes</SelectItem>
                          <SelectItem value="1800">30 minutes</SelectItem>
                          <SelectItem value="3600">1 hour</SelectItem>
                          <SelectItem value="86400">24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Danger Zone</h4>
                    <div className="space-y-2">
                      <Button variant="destructive" className="w-full justify-start" disabled={isLoading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Reset All Settings
                      </Button>
                      <Button variant="destructive" className="w-full justify-start" disabled={isLoading}>
                        <Database className="h-4 w-4 mr-2" />
                        Clear All Data
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        These actions are irreversible. Proceed with extreme caution.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Settings Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  Best Practices
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• Regular system backups</li>
                  <li>• Strong password policies</li>
                  <li>• Two-factor authentication</li>
                  <li>• Regular security audits</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Maintenance Schedule
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• Daily: System checks</li>
                  <li>• Weekly: Backup verification</li>
                  <li>• Monthly: Security updates</li>
                  <li>• Quarterly: Full audit</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-warning" />
                  Security Checklist
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• API key rotation</li>
                  <li>• User access reviews</li>
                  <li>• Log monitoring</li>
                  <li>• Update compliance</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
   
  );
}