// Application root component.
// Wraps the app in the Browser Router so AppRouter can use <Routes>.
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';

export default function App() {
    return (
        <BrowserRouter>
            <AppRouter />
        </BrowserRouter>
    );
}
