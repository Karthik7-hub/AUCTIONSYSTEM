import React from 'react';
import { User } from 'lucide-react';

// Reusable component for displaying a player item in a list
export default function PlayerCard({ player, onClick, isSelected }) {
    return (
        <div
            onClick={onClick}
            className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all flex items-center gap-3
        ${isSelected
                    ? 'bg-blue-50 border-blue-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
        >
            <div className="bg-gray-100 p-2 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
                <div className="font-bold text-gray-800">{player.name}</div>
                <div className="text-xs text-gray-500 flex justify-between">
                    <span>{player.role}</span>
                    <span className="bg-gray-100 px-2 rounded-full">Base: {player.basePrice}L</span>
                </div>
            </div>
        </div>
    );
}