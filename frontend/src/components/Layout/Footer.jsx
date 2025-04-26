import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-700 text-gray-300 p-4 mt-10">
      <div className="container mx-auto text-center text-sm">
        <p>© {currentYear} CRISIS MAPPER. All rights reserved.</p>
        <p className="mt-1">Connecting Help, Saving Lives.</p>
        {/* Optional: Add links to privacy policy, terms, etc. */}
      </div>
    </footer>
  );
}

export default Footer;