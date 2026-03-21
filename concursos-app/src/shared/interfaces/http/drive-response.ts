export interface DriveFile {
  id: string
  name: string
  createdTime: string
  modifiedTime: string
}

export interface DriveFileList {
  files: DriveFile[]
}
