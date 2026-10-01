import React, { useState } from 'react';
import { Clock, FileText, CheckCircle, Shield } from 'lucide-react';
import { libraryTimings } from '../data/mockData';

interface LircInfoScreenProps {
  initialTab?: 'timings' | 'rules';
}

export const LircInfoScreen: React.FC<LircInfoScreenProps> = ({
  initialTab = 'timings'
}) => {
  const [tab, setTab] = useState<'timings' | 'rules'>(initialTab);

  return (
    <div className="p-4 space-y-4 animate-fade-in text-white pb-24">
      {/* Tab bar */}
      <div className="flex border-b border-[#2C2C30]">
        <button
          onClick={() => setTab('timings')}
          className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-all relative ${
            tab === 'timings' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>LIRC Hours</span>
          {tab === 'timings' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>

        <button
          onClick={() => setTab('rules')}
          className={`flex-1 pb-3 text-xs font-semibold tracking-wide transition-all relative ${
            tab === 'rules' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>Rules</span>
          {tab === 'rules' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8A151B]" />
          )}
        </button>
      </div>

      {/* TAB 1: TIMINGS */}
      {tab === 'timings' && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-gray-800 text-xs text-gray-300">
            <span className="font-bold text-white">LIRC Operational Timings: </span>
            The Learning & Information Resource Centre operates 7 days a week for university students, faculty, and research scholars.
          </div>

          {libraryTimings.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#FFA726] text-black shadow-md space-y-2 border border-amber-500"
            >
              <div className="text-center font-bold text-sm border-b-2 border-black/80 pb-1">
                {item.dayRange}
              </div>

              <div className="flex items-center space-x-2 pt-1 font-semibold text-xs">
                <Clock className="w-4 h-4 text-black shrink-0" />
                <span>Opening Hours: {item.openingHours}</span>
              </div>

              <div className="flex items-center space-x-2 text-xs font-medium">
                <span className="w-4 text-center font-bold">■</span>
                <span>Circulation Desk: {item.circulationHours}</span>
              </div>

              {item.notes && (
                <div className="text-[11px] text-black/80 italic pt-1 border-t border-black/20">
                  Note: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: GENERAL RULES */}
      {tab === 'rules' && (
        <div className="p-4 rounded-3xl bg-[#1C1C1E] border border-[#2C2C30] text-xs text-gray-300 space-y-3">
          <h3 className="text-sm font-bold text-white pb-2 border-b border-gray-800">
            LIRC General Regulations & Borrowing Policy
          </h3>

          <ol className="list-decimal pl-4 space-y-2.5 leading-relaxed">
            <li>Every user must tap their RFID Card at the RFID gate turnstile upon entering and exiting.</li>
            <li>All personal belongings, bags, and coats must be deposited at the property counter. Laptops and notebooks are permitted.</li>
            <li>Undergraduate students are eligible to borrow up to <strong>5 books</strong> simultaneously for a period of <strong>15 days</strong>.</li>
            <li>Books can be renewed up to 2 times online via this application, provided no reservation exists from another student.</li>
            <li>Discussion rooms must be reserved in advance with verified academic justification and approved by the Librarian.</li>
            <li>Strict silence must be maintained in the Silent Reading Hall and Reference Stack Wing.</li>
            <li>E-resources, IEEE Xplore, ACM Digital Library, and Koha OPAC can be accessed via university Wi-Fi or remote OpenAthens portal.</li>
          </ol>
        </div>
      )}
    </div>
  );
};