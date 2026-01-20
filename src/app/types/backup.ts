export enum BackupType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  DIFFERENTIAL = 'DIFFERENTIAL'
}

export enum BackupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum BackupStorage {
  LOCAL = 'LOCAL',
  S3 = 'S3',
  ALIYUN_OSS = 'ALIYUN_OSS',
  FTP = 'FTP',
  SFTP = 'SFTP'
}

export interface BackupConfig {
  id: string;
  name: string;
  type: BackupType;
  storage: BackupStorage;
  schedule: string;
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
  encryptionKey?: string;
  storageConfig: {
    localPath?: string;
    s3?: {
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
    };
    aliyunOss?: {
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
    };
    ftp?: {
      host: string;
      port: number;
      username: string;
      password: string;
      path: string;
    };
    sftp?: {
      host: string;
      port: number;
      username: string;
      privateKey?: string;
      password?: string;
      path: string;
    };
  };
  includedPaths: string[];
  excludedPaths: string[];
  isActive: boolean;
  createdAt: string;
  lastBackup?: string;
}

export interface BackupRecord {
  id: string;
  configId: string;
  configName: string;
  type: BackupType;
  status: BackupStatus;
  startTime: string;
  endTime?: string;
  size: number;
  compressedSize?: number;
  filesCount: number;
  storage: BackupStorage;
  storagePath: string;
  checksum?: string;
  errorMessage?: string;
  createdBy: string;
}

export interface RestoreRecord {
  id: string;
  backupId: string;
  backupName: string;
  status: BackupStatus;
  startTime: string;
  endTime?: string;
  restorePath: string;
  filesRestored: number;
  errorMessage?: string;
  createdBy: string;
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  successfulBackups: number;
  failedBackups: number;
  lastBackupTime?: string;
  nextBackupTime?: string;
  storageUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}
