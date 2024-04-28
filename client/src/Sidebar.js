// Import necessary React and Router utilities.
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sidebar.css'; // CSS for styling the sidebar component.

const Sidebar = ({ userProfile, onLogout }) => {
    const navigate = useNavigate(); // Hook to programmatically navigate between routes.

    // Handle clicks on the profile link, preventing default browser link behavior and using navigate for routing.
    const handleProfileClick = (e) => {
        e.preventDefault(); // Prevent the default link behavior.
        if (userProfile && userProfile.displayName) {
            // Navigate to the user's profile page if profile data is available.
            navigate(`/profile/${userProfile.displayName}`);
        } else {
            // Alert the user if profile data is not available.
            alert('Profile data is not available.');
        }
    };

    // Conditional rendering of user data, displaying placeholders if not available.
    const displayName = userProfile ? userProfile.displayName : 'Unknown';
    const email = userProfile ? userProfile.email : 'No email provided';
    const profileImage = userProfile && userProfile.profileImage ? userProfile.profileImage : 'https://via.placeholder.com/150';

    // Render the sidebar with user information and navigation links.
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={profileImage} alt="Profile" className="sidebar-image" />
                <h2 className="sidebar-username">{displayName}</h2>
                <p className="sidebar-email">{email}</p>
            </div>
            <ul className="sidebar-menu">
                {/* Render navigation links with appropriate handlers and routes. */}
                <li><a href="/profile" onClick={handleProfileClick}>Profile</a></li> {/* Custom click handler to prevent default and use React Router's navigate. */}
                <li><Link to="/">Feed</Link></li> {/* Standard Link component for navigation without additional logic. */}
                <li><Link to="/friends">Messages</Link></li>
            </ul>
            <div className="sidebar-footer">
                {/* Logout link with an event handler passed from the parent component. */}
                <a href="#" onClick={onLogout}>Logout</a>
            </div>
        </div>
    );
};

export default Sidebar;
