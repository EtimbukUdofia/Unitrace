import { DocumentData, DocumentReference, GeoPoint, getDoc, Timestamp } from "firebase/firestore";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

type OngoingLecture = {
  id: string;
  courseTitle: string;
  lecturer: string;
  time: string;
  date: string;
  location: string;
  code: string,
  status: 'pending' | 'completed' | 'missed' | 'ongoing';

  location_id?: DocumentReference;
  locationData?: [] | GeoPoint[] | { coordinates: { latitude: number; longitude: number }[] };
  startTime?: Date | Timestamp | string;
  endTime?: Date | Timestamp | string;
  attendanceLogDocId?: string;
  halfDurationChecked?: boolean;
  lastGeofenseStatus?: boolean;
};

type AttendanceItem = DocumentData | null;

type AttendanceContextType = {
  attendanceContextIsLoading: boolean;
  classStarted: boolean;
  setClassStarted: React.Dispatch<React.SetStateAction<boolean>>;
  currentLectureData: AttendanceItem;
  setCurrentLectureData: React.Dispatch<React.SetStateAction<AttendanceItem>>;
  ongoingLecture: OngoingLecture | null;

  clearOngoingLecture: () => void;
};
export const AttendanceContext = createContext<AttendanceContextType>({
  classStarted: false,
  attendanceContextIsLoading: false,
  ongoingLecture: null,
  currentLectureData: null,
  setCurrentLectureData: () => { },
  setClassStarted: () => { },

  clearOngoingLecture: () => { },
});
export const AttendanceProvider = ({ children }: PropsWithChildren) => {
  const [ongoingLecture, setOngoingLecture] = useState<OngoingLecture | null>(null);
  const [currentLectureData, setCurrentLectureData] = useState<AttendanceItem>(null);
  const [attendanceContextIsLoading, setAttendanceContextIsLoading] = useState<boolean>(false);
  const [classStarted, setClassStarted] = useState<boolean>(false);

  const clearOngoingLecture = () => {
    setOngoingLecture(null);
    setCurrentLectureData(null);
    setClassStarted(false);
  };

  useEffect(() => {

    const fetchLectureDetails = async () => {
      if (!currentLectureData) {
        setOngoingLecture(null); // Reset ongoingLecture before fetching new 
        return;
      }

      setAttendanceContextIsLoading(true);

      try {
        // New schema: check for required embedded fields
        if (!currentLectureData.location || !currentLectureData.lecturer || !currentLectureData.subject || !currentLectureData.classCode || !currentLectureData.start_time) {
          console.error("Missing required fields in currentLectureData:", currentLectureData);
          throw new Error("Lecture details is incomplete. cannot fetch details.");
        }

        // Use embedded data directly
        const locationName = currentLectureData.location.name || "Unknown Location";
        const locationData = currentLectureData.location.coordinates || [];
        const courseTitle = currentLectureData.subject || "Unknown Subject";
        const courseCode = currentLectureData.classCode || "N/A";
        const lecturerName = currentLectureData.lecturer.name || "Unknown Lecturer";

        const lectureStartTime = currentLectureData.start_time instanceof Timestamp
          ? currentLectureData.start_time.toDate()
          : (currentLectureData.start_time ? new Date(currentLectureData.start_time) : null);

        const lectureEndTime = currentLectureData.end_time instanceof Timestamp
          ? currentLectureData.end_time.toDate()
          : (currentLectureData.end_time ? new Date(currentLectureData.end_time) : null);

        setOngoingLecture({
          id: currentLectureData.id || currentLectureData.sessionId || 'N/A',
          courseTitle: courseTitle,
          lecturer: lecturerName,
          time: lectureStartTime ? lectureStartTime.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', hour12: true }) : '',
          date: lectureStartTime ? lectureStartTime.toLocaleDateString('en-us', { weekday: 'long', month: 'short', day: 'numeric' }) : '',
          location: locationName,
          status: currentLectureData.status,
          code: courseCode,

          // No longer using Firestore references
          locationData: locationData,
          startTime: lectureStartTime,
          endTime: lectureEndTime,
          attendanceLogDocId: currentLectureData.attendanceLogDocId,
          halfDurationChecked: currentLectureData.halfDurationChecked || false,
          lastGeofenseStatus: currentLectureData.lastGeofenseStatus || true,
        });

      } catch (error) {
        console.error("Error fetching lecture details:", error);
        setOngoingLecture(null); // Reset ongoingLecture on error
        // Handle any potential errors from the fetch calls here
      } finally {
        setAttendanceContextIsLoading(false);
      }
    };

    fetchLectureDetails();
  }, [currentLectureData]);

  return (
    <AttendanceContext.Provider value={{ attendanceContextIsLoading, currentLectureData, setCurrentLectureData, classStarted, setClassStarted, ongoingLecture, clearOngoingLecture }}>
      {children}
    </AttendanceContext.Provider>
  );
};