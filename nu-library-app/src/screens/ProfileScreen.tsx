import React from 'react';
import { User, Mail, Phone, Calendar, BookOpen, Shield } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileScreenProps {
  user: UserProfile;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user }) => {
  const fields = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Enrollment Number', value: user.enrollmentNo },
    { label: 'Date Of Birth', value: user.dob },
    { label: 'Blood Group', value: user.bloodGroup },
    { label: 'Mobile Number', value: user.mobile },
    { label: 'Program Code', value: user.programCode },
    { label: 'Session', value: user.session },
    { label: 'Current Pattern', value: user.currentPattern },
    { label: "Father's Name", value: user.fatherName },
    { label: "Father's Mobile Number", value: user.fatherMobile },
    { label: "Mother's Name", value: user.motherName },
    { label: "Mother's Mobile Number", value: user.motherMobile },
  ];

  return (
    <div className="p-4 space-y-3 animate-fade-in text-white pb-24 max-w-lg mx-auto">
      {/* Photo 7 & 8 style rounded rectangular cards */}
      {fields.map((field, idx) => (
        <div
          key={idx}
          className="px-5 py-3.5 rounded-2xl bg-[#404044] border border-[#4d4d52] shadow-xs space-y-0.5"
        >
          <span className="text-xs font-medium text-gray-300 block">
            {field.label}
          </span>
          <span className="text-sm font-semibold text-white block tracking-wide">
            {field.value || '-'}
          </span>
        </div>
      ))}
    </div>
  );
};