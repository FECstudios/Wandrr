import React from 'react';

const BackendExplanation = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '70px',
        left: '20px',
        backgroundColor: '#f9f9f9',
        color: '#333',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        border: '1px solid #ddd',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        zIndex: 999,
        fontSize: '1em',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h2 style={{ marginTop: '0', marginBottom: '15px', color: '#0056b3' }}>Backend Explanation</h2>
      <h3>Backend Overview</h3>
      <p style={{ marginBottom: '10px' }}>
        The Wandrr application utilizes a serverless backend architecture built on Next.js API Routes. This means
        that each API endpoint &#40;e.g., <code>/api/auth/signup</code>, <code>/api/auth/login</code>&#41; is essentially a serverless function that
        executes on demand.
      </p>
      <p style={{ marginBottom: '10px' }}>
        The core data persistence and backend services are provided by Shov.com, which appears to be a custom
        backend-as-a-service &#40;BaaS&#41; platform. The application interacts with Shov.com using the <code>shov-js</code> SDK.
      </p>
      <h3>Key Technologies and Libraries</h3>
      <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginBottom: '10px' }}>
        <li style={{ marginBottom: '5px' }}><strong>Next.js API Routes:</strong> Provides the serverless function environment for handling API requests.</li>
        <li style={{ marginBottom: '5px' }}><strong>Shov.com &#40;<code>shov-js</code> SDK&#41;:</strong> The primary backend service for data storage, retrieval, and potentially other
          functionalities &#40;like search, as indicated by the <code>where</code> method&#41;. It's configured with <code>SHOV_PROJECT</code> and
          <code>SHOV_API_KEY</code> environment variables.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>bcryptjs</code>:</strong> Used for securely hashing and comparing user passwords. This is a standard practice for
          protecting sensitive user credentials.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>jsonwebtoken</code> &#40;JWT&#41;:</strong> Used for generating and verifying JSON Web Tokens, which are essential for user
          authentication and authorization. Once a user logs in, a JWT is issued, allowing them to access protected
          resources without re-authenticating on every request.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>retryUtils.js</code> &#40;inferred&#41;:</strong> Although not directly seen in these files, the extensive retry logic within
          <code>login.js</code> and <code>signup.js</code> suggests the presence of a <code>retryUtils.js</code> or similar module, or at least a strong
          pattern of implementing robust retry mechanisms for external service calls.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>console.log</code> for Debugging:</strong> The code includes numerous <code>console.log</code> statements for debugging and
          monitoring, which is helpful during development and for understanding runtime behavior.</li>
      </ul>
      <h3>Authentication Flow &#40;Login and Signup&#41;</h3>
      <h4>1. Signup &#40;<code>src/pages/api/auth/signup.js</code>&#41;</h4>
      <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginBottom: '10px' }}>
        <li style={{ marginBottom: '5px' }}><strong>Method Check:</strong> Ensures the request is a POST request.</li>
        <li style={{ marginBottom: '5px' }}><strong>Input Validation:</strong> Checks if email and password are provided in the request body.</li>
        <li style={{ marginBottom: '5px' }}><strong>Shov.com Initialization:</strong> Initializes the Shov client with project-specific credentials.</li>
        <li style={{ marginBottom: '5px' }}><strong>Existing User Check &#40;with Retry Logic&#41;:</strong>
          <ul style={{ listStyleType: 'circle', marginLeft: '20px', marginTop: '5px' }}>
            <li style={{ marginBottom: '5px' }}>Before creating a new user, the API attempts to query Shov.com's &quot;users&quot; collection to see if a user
              with the provided email already exists.</li>
            <li style={{ marginBottom: '5px' }}>It employs a robust retry mechanism with exponential backoff &#40;up to 5 attempts, with increasing
              delays&#41; to handle transient network issues or Shov.com service unavailability.</li>
            <li style={{ marginBottom: '5px' }}>It specifically checks for &quot;Capacity temporarily exceeded,&quot; &quot;rate limit,&quot; or &quot;3040&quot; errors from
              Shov.com, returning a 503 Service Unavailable response with a <code>retryAfter</code> header if these persist.</li>
            <li style={{ marginBottom: '5px' }}><strong>Database Error Fallback:</strong> If persistent database errors &#40;e.g., &quot;9002&quot;, &quot;unknown internal error&quot;,
              &quot;connection&quot;, &quot;timeout&quot;&#41; occur during the existing user check, the API returns a success status
              &#40;<code>201</code>&#41;. This is a critical design decision: it allows the client to proceed as if the account was
              created, enabling a &quot;local login&quot; fallback if the main database is down. This prioritizes user
              experience over strict immediate consistency in the face of backend issues.</li>
          </ul>
        </li>
        <li style={{ marginBottom: '5px' }}><strong>Password Hashing:</strong> If no existing user is found, the provided password is securely hashed using
          <code>bcrypt.hash</code> with a salt round of 10.</li>
        <li style={{ marginBottom: '5px' }}><strong>New User Object Creation:</strong> A <code>newUser</code> object is constructed with:
          <ul style={{ listStyleType: 'circle', marginLeft: '20px', marginTop: '5px' }}>
            <li style={{ marginBottom: '5px' }}>A unique <code>id</code> &#40;e.g., user-timestamp&#41;.</li>
            <li style={{ marginBottom: '5px' }}><code>email</code> and <code>hashedPassword</code>.</li>
            <li style={{ marginBottom: '5px' }}>A default <code>username</code> derived from the email.</li>
            <li style={{ marginBottom: '5px' }}>Initial <code>xp</code>, <code>streak</code>, <code>completed_lessons</code>, <code>mistakes</code>, and <code>preferences</code>.</li>
            <li style={{ marginBottom: '5px' }}><code>created_at</code> timestamp.</li>
          </ul>
        </li>
        <li style={{ marginBottom: '5px' }}><strong>Add User to Shov.com:</strong> The <code>newUser</code> object is added to the &quot;users&quot; collection in Shov.com using <code>shov.add()</code>.</li>
        <li style={{ marginBottom: '5px' }}><strong>Verification &#40;with Retry Logic&#41;:</strong> After adding the user, the API attempts to verify the user's creation by
          querying Shov.com again for the newly registered email. This also includes retry logic and a manual
          search fallback &#40;getting all users and filtering&#41; to account for potential indexing delays in Shov.com. A
          2-second delay is introduced after user creation to allow for data propagation and search index updates
          within Shov.com.</li>
        <li style={{ marginBottom: '5px' }}><strong>Response:</strong> Returns a 201 Created status with a success message and the new <code>userId</code>.</li>
        <li style={{ marginBottom: '5px' }}><strong>Error Handling:</strong> Catches and logs errors, returning appropriate HTTP status codes and messages for various
          failure scenarios &#40;e.g., 405 Method Not Allowed, 400 Bad Request, 409 Conflict for existing user, 500
          Internal Server Error, 503 Service Unavailable&#41;.</li>
      </ul>
      <h4>2. Login &#40;<code>src/pages/api/auth/login.js</code>&#41;</h4>
      <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginBottom: '10px' }}>
        <li style={{ marginBottom: '5px' }}><strong>Method Check & Input Validation:</strong> Similar to signup.</li>
        <li style={{ marginBottom: '5px' }}><strong>Shov.com Initialization:</strong> Initializes the Shov client.</li>
        <li style={{ marginBottom: '5px' }}><strong>Fetch User &#40;with Enhanced Retry Logic and Local Fallback&#41;:</strong>
          <ul style={{ listStyleType: 'circle', marginLeft: '20px', marginTop: '5px' }}>
            <li style={{ marginBottom: '5px' }}>Attempts to retrieve the user by email from Shov.com's &quot;users&quot; collection using <code>shov.where()</code>.</li>
            <li style={{ marginBottom: '5px' }}>Employs an enhanced retry mechanism with exponential backoff and jitter &#40;up to 5 attempts&#41;.</li>
            <li style={{ marginBottom: '5px' }}><strong>Critical Local Fallback:</strong> If Shov.com's search service is temporarily unavailable or persistent
              database errors occur after all retries, the system falls back to creating a &quot;local user&quot; object.
              <ul style={{ listStyleType: 'square', marginLeft: '20px', marginTop: '5px' }}>
                <li style={{ marginBottom: '5px' }}>This <code>localUser</code> object is generated on the fly with a <code>local-user-</code> prefix for its ID and an
                  <code>isLocalUser: true</code> flag.</li>
                <li style={{ marginBottom: '5px' }}>A JWT is then generated for this local user, allowing the client to operate in a &quot;local mode&quot; even
                  without full backend connectivity. This is a highly resilient design choice for maintaining user
                  experience during backend outages.</li>
              </ul>
            </li>
          </ul>
        </li>
        <li style={{ marginBottom: '5px' }}><strong>Password Comparison:</strong> If a user is found &#40;either from Shov.com or as a local fallback&#41;, the provided
          password is compared with the stored <code>hashedPassword</code> using <code>bcrypt.compare()</code>.</li>
        <li style={{ marginBottom: '5px' }}><strong>JWT Generation:</strong> If the password is valid, a JSON Web Token &#40;JWT&#41; is generated using <code>jsonwebtoken.sign()</code>.
          <ul style={{ listStyleType: 'circle', marginLeft: '20px', marginTop: '5px' }}>
            <li style={{ marginBottom: '5px' }}>The JWT payload includes <code>userId</code> and <code>email</code>. For local users, it also includes <code>isLocalUser: true</code>.</li>
            <li style={{ marginBottom: '5px' }}>The token expires in 1 hour for regular users and 24 hours for local users.</li>
          </ul>
        </li>
        <li style={{ marginBottom: '5px' }}><strong>Response:</strong> Returns a 200 OK status with a success message and the generated token. If in local mode, it
          also includes the <code>user</code> object and <code>isLocalMode: true</code>.</li>
        <li style={{ marginBottom: '5px' }}><strong>Error Handling:</strong> Comprehensive error handling for invalid credentials &#40;401 Unauthorized&#41;, service
          unavailability &#40;503 Service Unavailable&#41;, and generic internal server errors &#40;500 Internal Server Error&#41;.</li>
      </ul>
      <h3>Data Model &#40;Inferred from <code>newUser</code> object&#41;</h3>
      <p style={{ marginBottom: '10px' }}>The users collection in Shov.com stores the following information for each user:</p>
      <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginBottom: '10px' }}>
        <li style={{ marginBottom: '5px' }}><strong><code>id</code>:</strong> Unique identifier for the user.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>email</code>:</strong> User's email address &#40;used as a primary identifier&#41;.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>hashedPassword</code>:</strong> Securely hashed password.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>username</code>:</strong> Display name for the user.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>xp</code>:</strong> Experience points.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>streak</code>:</strong> Current learning streak.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>completed_lessons</code>:</strong> Array of completed lesson IDs.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>mistakes</code>:</strong> Array of recorded mistakes &#40;e.g., for spaced repetition&#41;.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>preferences</code>:</strong> Array of learning preferences &#40;e.g., &#91;'greetings', 'dining'&#93;&#41;.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>created_at</code>:</strong> Timestamp of user creation.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>isLocalUser</code> &#40;for local fallback users&#41;:</strong> A boolean flag indicating if the user is operating in local mode.</li>
      </ul>
      <h3>Shov.com Integration</h3>
      <p style={{ marginBottom: '10px' }}>Shov.com is central to the backend operations. The <code>shov-js</code> SDK is used for:</p>
      <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginBottom: '10px' }}>
        <li style={{ marginBottom: '5px' }}><strong>Data Storage:</strong> <code>shov.add(&#39;users&#39;, newUser)</code> to create new user records.</li>
        <li style={{ marginBottom: '5px' }}><strong>Data Retrieval:</strong> <code>shov.where(&#39;users&#39;, &lbrace; filter: &lbrace; email &rbrace;, limit: 1 &rbrace;)</code> to query for users based on their
          email.</li>
      </ul>
      <p style={{ marginBottom: '10px' }}>The extensive retry logic and local fallback mechanisms demonstrate a strong emphasis on resilience and
        fault tolerance when interacting with Shov.com, ensuring the application remains functional even if the
        backend service experiences temporary issues.</p>
      <h3>Further Backend Components &#40;Inferred from File Structure&#41;:</h3>
      <ul style={{ listStyleType: 'disc', marginLeft: '20px', marginBottom: '10px' }}>
        <li style={{ marginBottom: '5px' }}><strong><code>src/lib/huggingface.js</code> & <code>src/lib/lessonGenerator.js</code>:</strong> These strongly suggest the use of AI/ML models
          &#40;likely from Hugging Face&#41; for generating interactive lessons. <code>lessonGenerator.js</code> would orchestrate this
          process.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>src/pages/api/lesson/generate.js</code>:</strong> An API endpoint to trigger the lesson generation process.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>src/pages/api/leaderboard.js</code>:</strong> Manages and retrieves data for a user leaderboard.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>src/pages/api/user/[userId].js</code> & <code>src/pages/api/user/local/[userId].js</code>:</strong> Endpoints for managing user
          profiles, potentially with specific handling for local-mode users.</li>
        <li style={{ marginBottom: '5px' }}><strong><code>src/lib/userCache.js</code>:</strong> Likely implements caching strategies for user data to improve performance and
          reduce Shov.com calls.</li>
      </ul>
      <p style={{ marginBottom: '10px' }}>In summary, the Wandrr backend is a resilient, serverless application leveraging Next.js API Routes and
        Shov.com for its core services, with a strong emphasis on user experience even during backend service
        interruptions.</p>
      <button
        onClick={onClose}
        style={{
          marginTop: '15px',
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          alignSelf: 'flex-end',
        }}
      >
        Close
      </button>
    </div>
  );
};

export default BackendExplanation;
