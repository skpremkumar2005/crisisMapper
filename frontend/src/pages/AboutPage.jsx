import React from 'react';

function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">About Crisis Mapper</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed">
          Crisis Mapper aims to bridge the gap between people affected by disasters and
          the volunteers ready to help. By leveraging real-time data from social media
          and user reports, we provide a dynamic map of ongoing crises and facilitate
          rapid response coordination, similar to how delivery apps connect users with services,
          but focused on critical aid.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">How It Works</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
          <li>
            <strong>Real-time Tracking:</strong> Our system monitors social media feeds (via your API) and allows user reports to identify potential crisis events.
          </li>
           <li>
            <strong>Visualization:</strong> Events are plotted on an interactive map, showing location, type, and severity.
          </li>
          <li>
            <strong>Volunteer Network:</strong> Volunteers register with their skills and availability, enabling location-based notifications for nearby incidents.
          </li>
           <li>
            <strong>Request Assistance:</strong> Civilians impacted by a crisis can request specific help through the platform.
          </li>
           <li>
            <strong>Efficient Dispatch:</strong> The system notifies the closest available and suitable volunteers.
          </li>
            <li>
            <strong>Response Workflow:</strong> Volunteers accept tasks, update their status (en route, arrived), and mark tasks as complete.
          </li>
           <li>
            <strong>Feedback Loop:</strong> A rating system allows civilians to provide feedback on the assistance received, promoting accountability and quality. Rewards and penalties incentivize reliable participation.
          </li>
        </ul>
      </section>

       <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Technology Stack</h2>
        <p className="text-gray-600 leading-relaxed mb-2">
            Crisis Mapper is built using modern web technologies:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
             <li><strong>Frontend:</strong> React, React Router, Context API/Redux, Tailwind CSS, Mapbox GL JS</li>
             <li><strong>Backend:</strong> Node.js, Express, Socket.IO, JWT</li>
             <li><strong>Database:</strong> MongoDB (with Geospatial Queries)</li>
              <li><strong>Data Source:</strong> Your custom API at `localhost:3040/api`</li>
        </ul>
      </section>

       <section className="mt-8 text-center text-sm text-gray-500">
           <p>This platform is a proof-of-concept and under continuous development.</p>
       </section>
    </div>
  );
}

export default AboutPage;