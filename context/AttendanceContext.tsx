import { DocumentData, getDoc } from "firebase/firestore";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

type OngoingLecture = {
  id: number;
  courseTitle: string;
  lecturer: string;
  time: string;
  date: string;
  location: string;
  code: string,
  status: 'pending' | 'completed' | 'missed' | 'ongoing';
};

type AttendanceItem = DocumentData | null;

type AttendanceContextType = {
  attendanceContextIsLoading: boolean;
  classStarted: boolean;
  setClassStarted: React.Dispatch<React.SetStateAction<boolean>>;
  currentLectureData: AttendanceItem;
  setCurrentLectureData: React.Dispatch<React.SetStateAction<AttendanceItem>>;
  ongoingLecture: OngoingLecture | null;
};
export const AttendanceContext = createContext<AttendanceContextType>({
  classStarted: false,
  attendanceContextIsLoading: false,
  ongoingLecture: null,
  currentLectureData: null,
  setCurrentLectureData: () => { },
  setClassStarted: () => {},
});
export const AttendanceProvider = ({ children }: PropsWithChildren) => {
  const [ongoingLecture, setOngoingLecture] = useState<OngoingLecture | null>(null);
  const [currentLectureData, setCurrentLectureData] = useState<AttendanceItem>(null);
  const [attendanceContextIsLoading, setAttendanceContextIsLoading] = useState<boolean>(false);
  const [classStarted, setClassStarted] = useState<boolean>(false);

  useEffect(() => {
    if (currentLectureData) {
      const fetchLectureDetails = async () => {
        try {
          const locationPromise = getDoc(currentLectureData.location_id);
          const coursePromise = getDoc(currentLectureData.course_id);
          const lecturerPromise = getDoc(currentLectureData.lecturer_id);

          const [locationDoc, courseDoc, lecturerDoc] = await Promise.all([
            locationPromise as DocumentData,
            coursePromise as DocumentData,
            lecturerPromise as DocumentData,
          ]);

          const locationName = locationDoc.exists() ? locationDoc.data().name : "Unknown Location";
          const courseTitle = courseDoc.exists() ? courseDoc.data().title : "Unknown Subject";
          const courseCode = courseDoc.exists() ? courseDoc.data().code : "N/A";
          const lecturerName = lecturerDoc.exists() ? lecturerDoc.data().fullName : "Unknown Lecturer";

          setOngoingLecture({
            id: 1, // Consider using a more unique ID if available
            courseTitle: courseTitle,
            lecturer: lecturerName,
            time: currentLectureData.start_time.toDate().toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', hour12: true }),
            date: currentLectureData.start_time.toDate().toLocaleDateString('en-us', { weekday: 'long', month: 'short', day: 'numeric' }),
            location: locationName,
            status: currentLectureData.status,
            code: courseCode,
          });

        } catch (error) {
          console.error("Error fetching lecture details:", error);
          // Handle any potential errors from the fetch calls here
        }
      };

      fetchLectureDetails();
    }

    console.log("attendance context");
  }, [currentLectureData]);

  return (
    <AttendanceContext.Provider value={{ attendanceContextIsLoading, currentLectureData, setCurrentLectureData, classStarted, setClassStarted, ongoingLecture}}>
      {children}
    </AttendanceContext.Provider>
  );
};