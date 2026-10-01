import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const CAROUSEL_IMAGES = [
  '/assets/home_img_0.jpg',
  '/assets/home_img_1.jpg',
  '/assets/home_img_2.jpg',
  '/assets/home_img_3.jpeg',
  '/assets/home_img_4.jpg'
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // One-click student sign-in (Instant bypass per user instructions)
  const handleStudentSignIn = () => {
    const studentUser = StorageService.loginAsStudent();
    onLoginSuccess(studentUser);
  };

  return (
    <div className="min-h-full w-full flex flex-col justify-between bg-[#8B1E1E] text-white relative select-none animate-fade-in overflow-hidden">
      {/* Top Rounded Campus Image Carousel */}
      <div className="relative w-full h-[46vh] min-h-[290px] overflow-hidden rounded-b-[44px] shadow-2xl bg-black">
        {CAROUSEL_IMAGES.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Campus scene ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/universitybg.jpg';
            }}
          />
        ))}

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Carousel Pagination Dots */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-2 z-10">
          {CAROUSEL_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentSlide
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-black/50 hover:bg-white/50'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Center Section: Welcome and Sign-In */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 text-center z-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-wide drop-shadow-md mb-8">
          NU LIRC
        </h2>

        {/* Google Sign In Pill Button (Instant One-Click Login) */}
        <button
          onClick={handleStudentSignIn}
          className="w-full max-w-[290px] py-3.5 px-6 rounded-full bg-[#121214] hover:bg-black text-white font-medium flex items-center justify-center space-x-3.5 shadow-2xl active:scale-96 transition-all duration-200 border border-black/30 group"
        >
          <img
            src="/assets/google.png"
            alt="Google"
            className="w-5 h-5 object-contain group-hover:scale-110 transition-transform"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-base font-semibold tracking-wide">
            Sign In
          </span>
        </button>

      </div>
    </div>
  );
};