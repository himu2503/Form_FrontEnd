import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { Helmet } from 'react-helmet';

const BASE_URL = 'https://form-backend-6rz4.onrender.com';

function App() {
  const [formValues, setFormValues] = useState({
    name: '', father: '', mother: '', husband: '', district: '',
    block: '', village: '', policeStation: '', mobile: '', panchayat: '',
    postOffice: '', applicationNumber: '', serviceName: '', officialName: '',
    serviceDeliveryDate: '', submissionDate: '', documents: ''
  });
  const [files, setFiles] = useState({ photo: null, signature: null });
  const [showModal, setShowModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const captchaRendered = useRef(false);

  useEffect(() => {
    if (window.grecaptcha && !captchaRendered.current) {
      window.grecaptcha.ready(() => {
        window.grecaptcha.render('recaptcha-container', {
          sitekey: '6LeZ1WkrAAAAAAtjsRpbBwZoO9ISZjHQfdCa4BTJ'
        });
        captchaRendered.current = true;
      });
    }
  }, []);

  const handleInputChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles((prev) => ({ ...prev, [name]: selectedFiles[0] }));
  };

  const previewImage = (file) => file ? URL.createObjectURL(file) : '';

  const handleSubmit = async (e) => {
    e.preventDefault();

    const recaptchaResponse = window.grecaptcha.getResponse();
    if (!recaptchaResponse) {
      alert('Please complete the CAPTCHA');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formValues.mobile,
          recaptcha: recaptchaResponse
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(true);
      } else {
        alert(data.message || 'Failed to send OTP or verify reCAPTCHA.');
        window.grecaptcha.reset();
      }
    } catch (error) {
      console.error('OTP Send Error:', error);
      alert('Something went wrong while sending OTP.');
      window.grecaptcha.reset();
    }
  };


  const handleOtpSubmit = async () => {
    try {
      const res = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formValues.mobile, otp })
      });

      const { success } = await res.json();
      if (!success) {
        return alert('Invalid OTP');
      }

      const formData = new FormData();
      Object.entries(formValues).forEach(([k, v]) => formData.append(k, v));
      formData.append('photo', files.photo);
      formData.append('signature', files.signature);

      const genRes = await fetch(`${BASE_URL}/generate-receipt`, {
        method: 'POST',
        body: formData
      });

      const { success: genSuccess, url } = await genRes.json();
      if (genSuccess) {
        setShowModal(false);
        setDownloadLink(url);
      } else {
        alert('Failed to generate receipt.');
      }
    } catch (error) {
      console.error('OTP Submit Error:', error);
      alert('Something went wrong.');
    }
  };


  return (
    <div className="App">
      <Helmet>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </Helmet>

      <h1>Apply Form</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {[
          { label: "Name of Applicant", name: "name" },
          { label: "Father's Name", name: "father" },
          { label: "Mother's Name", name: "mother" },
          { label: "Date of Birth", name: "dob", type: "date" },
          { label: "Email", name: "email", type: "email" },
          { label: "Amount", name: "amount", type: "number" },
          { label: "Husband's Name", name: "husband" },
          { label: "Village", name: "village" },
          { label: "Post Office", name: "post" },
          { label: "Block", name: "block" },
          { label: "District", name: "district" },
          { label: "Panchayat", name: "panchayat" }
        ].map(({ label, name, type = "text", pattern }) => (
          <label key={name}>{label}:
            <input
              type={type}
              name={name}
              value={formValues[name]}
              onChange={handleInputChange}
              required={name !== 'husband'}
              pattern={pattern}
            />
          </label>
        ))}

        <label>Mobile Number:
          <input
            type="tel"
            name="mobile"
            pattern="[0-9]{10}"
            required
            value={formValues.mobile}
            onChange={handleInputChange}
          />
        </label>

        <label>Upload Applicant Image:
          <input type="file" name="photo" accept="image/*" onChange={handleFileChange} />
        </label>
        {files.photo && <div className="preview-box"><img src={previewImage(files.photo)} alt="Applicant" /></div>}

        <label>Upload Signature:
          <input type="file" name="signature" accept="image/*" onChange={handleFileChange} />
        </label>
        {files.signature && <div className="preview-box"><img src={previewImage(files.signature)} alt="Signature" /></div>}

        <label>
          <input type="checkbox" required /> I declare that all information provided above is true and correct.
        </label>

        <div className="recaptcha-box" id="recaptcha-container"></div>

        <div className="button-row">
          <button type="submit" className="submit">Proceed</button>
          <button type="reset" className="reset">Reset</button>
          <button type="button" className="button" onClick={() => window.close()}>Close</button>
        </div>
      </form>

      {downloadLink && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href={downloadLink} download target="_blank" rel="noopener noreferrer">
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>
              📄 Download Acknowledgement Receipt
            </button>
          </a>
        </div>
      )}


      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h3>Enter OTP sent to your phone</h3>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              required
            />
            <button onClick={handleOtpSubmit}>Submit OTP</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
