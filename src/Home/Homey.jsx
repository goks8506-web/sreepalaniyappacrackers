import React from 'react'
import Navbar from '../Component/Navbar'
import "../App.css";

export default function Homey() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
        <Navbar/>
        <div className="text-center p-6 max-w-2xl">
          <h1 className="text-4xl font-bold text-orange-800 mb-6">
            Welcome to Madhu Nisha Crackers 🎉
          </h1>
          <p className="text-lg text-orange-500 mb-4">
            We are close now due to lack of transportation 🚚. 
            Thank you for your understanding! 😊
          </p>
          <p className="text-lg text-orange-500 mb-4">
            We will meet you soon in the next Diwali! 🪔
          </p>
          <p className="text-xl font-bold text-red-500">
            We wish you all a safe and wonderful Diwali! 🎆✨
          </p>
        </div>
    </div>
  )
}