import React from 'react';
import './Sidebar.css'; // Ensure this is correctly linked
import { Link } from 'react-router-dom';

const Sidebar = ({ userProfile, onLogout }) => {
    const displayName = userProfile ? userProfile.displayName : 'Unknown';
    const email = userProfile ? userProfile.email : 'No email provided';
    const profileImage = userProfile && userProfile.profileImage ? userProfile.profileImage : 'https://via.placeholder.com/150';

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={profileImage} alt="Profile" className="sidebar-image" />
                <h2 className="sidebar-username">{displayName}</h2>
                <p className="sidebar-email">{email}</p>
            </div>
            <ul className="sidebar-menu">
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/">Feed</Link></li>
                <li><Link to="/friends">Friends</Link></li>
            </ul>
            <div className="sidebar-footer">
                <a href="#" onClick={onLogout}>Logout</a>
            </div>
        </div>
    );
};

export default Sidebar;
