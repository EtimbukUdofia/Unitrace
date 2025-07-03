export const getStatusIcon = (status:string) => {
  switch (status) {
    case 'present':
      return 'checkmark-circle';
    case 'absent':
      return 'close-circle';
    case 'pending':
      return 'time-outline';
    case 'ongoing':
      return 'time-outline';
    case 'missed':
      return 'alert-circle';
    default:
      return 'help-circle';
  }
};

export const getStatusColor = (status:string) => {
  switch (status) {
    case 'present':
      return '#10b981';
    case 'absent':
      return '#ef4444';
    case 'pending':
      return '#3b82f6';
    case 'ongoing':
      return '#3b82f6';
    case 'missed':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export const getAttendanceColor = (percentage:number) => {
  if (percentage >= 85) return '#10b981';
  if (percentage >= 75) return '#f59e0b';
  return '#ef4444';
};

export const getClassStatusColor = (status: string) => {
  switch (status) {
    case 'upcoming':
      return '#3b82f6';
    case 'ongoing':
      return '#10b981';
    case 'completed':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

export const getClassStatusIcon = (status: string) => {
  switch (status) {
    case 'upcoming':
      return 'time-outline';
    case 'ongoing':
      return 'play-circle';
    case 'completed':
      return 'checkmark-circle';
    default:
      return 'help-circle';
  }
};
