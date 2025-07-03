import { DocumentData } from "firebase/firestore";
import { createContext, PropsWithChildren, useEffect, useState } from "react";

type ClassItem = {
  id: number;
  subject: string;
  lecturer: string;
  expectedTime: string;
  location: string;
  status: 'pending' | 'completed' | 'missed';
};

type AttendanceContextType = {
  isLoading: boolean;
  classStarted: boolean;
  currentLectureData: ClassItem | DocumentData;
  setCurrentLectureData: React.Dispatch<React.SetStateAction<ClassItem>>;
  setClassStarted: React.Dispatch<React.SetStateAction<boolean>>;
};
export const AttendanceContext = createContext<AttendanceContextType>({
  classStarted: false,
  isLoading: false,
  currentLectureData: 
    {
      id: 1,
      subject: 'Operating Systems',
      lecturer: 'Dr. Brown',
      expectedTime: '10:00 AM',
      location: 'Lab 301',
      status: 'pending',
    },

  setCurrentLectureData: () => { },
  setClassStarted: () => {},
});
export const AttendanceProvider = ({ children }: PropsWithChildren) => {
  const [currentLectureData, setCurrentLectureData] = useState<ClassItem | DocumentData>({
    id: 1,
    subject: 'Operating Systems',
    lecturer: 'Dr. Brown',
    expectedTime: '10:00 AM',
    location: 'Lab 301',
    status: 'pending',
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [classStarted, setClassStarted] = useState<boolean>(false);

  // You can fetch and update currentLectureData here if needed
  // useEffect(() => {
  //   // Fetch attendance data from backend or Firestore and update setCurrentLectureData
  // }, []);

  return (
    <AttendanceContext.Provider value={{ isLoading, currentLectureData, setCurrentLectureData, classStarted, setClassStarted }}>
      {children}
    </AttendanceContext.Provider>
  );
};