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
        if (!currentLectureData.location_id || !currentLectureData.course_id || !currentLectureData.lecturer_id) { 
          console.error("Missing required references in currentLectureData:", currentLectureData);
          throw new Error("Lecture data is incomplete. Cannot fetch details.");
        }

        const locationPromise = getDoc(currentLectureData.location_id);
        const coursePromise = getDoc(currentLectureData.course_id);
        const lecturerPromise = getDoc(currentLectureData.lecturer_id);

        const [locationDoc, courseDoc, lecturerDoc] = await Promise.all([
          locationPromise as DocumentData,
          coursePromise as DocumentData,
          lecturerPromise as DocumentData,
        ]);

        const locationName = locationDoc.exists() ? locationDoc.data().name : "Unknown Location";
        const locationData = locationDoc.exists() ? locationDoc.data().coordinates : [];
        const courseTitle = courseDoc.exists() ? courseDoc.data().title : "Unknown Subject";
        const courseCode = courseDoc.exists() ? courseDoc.data().code : "N/A";
        const lecturerName = lecturerDoc.exists() ? lecturerDoc.data().fullName : "Unknown Lecturer";

        const lectureStartTime = currentLectureData.startTime instanceof Timestamp
          ? currentLectureData.startTime.toDate()
          : (currentLectureData.startTime ? new Date(currentLectureData.startTime) : null);

        const lectureEndTime = currentLectureData.endTime instanceof Timestamp
          ? currentLectureData.endTime.toDate()
          : (currentLectureData.endTime ? new Date(currentLectureData.endTime) : null);

        setOngoingLecture({
          id: currentLectureData.sessionId || 'N/A', // Consider using a more unique ID if available
          courseTitle: courseTitle,
          lecturer: lecturerName,
          time: currentLectureData.start_time.toDate().toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', hour12: true }),
          date: currentLectureData.start_time.toDate().toLocaleDateString('en-us', { weekday: 'long', month: 'short', day: 'numeric' }),
          location: locationName,
          status: currentLectureData.status,
          code: courseCode,

          location_id: currentLectureData.location_id,
          locationData: locationData as GeoPoint[],
          startTime: currentLectureData.startTime || lectureStartTime,
          endTime: currentLectureData.endTime || lectureEndTime,
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