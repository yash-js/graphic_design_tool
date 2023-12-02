import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TemplateBuilder = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState('');
  const contentRef = useRef(null);

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImage(selectedImage);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const exportToJSON = () => {
    const dataToExport = {
      image: image ? URL.createObjectURL(image) : null,
      text: text,
    };

    const jsonData = JSON.stringify(dataToExport);
    console.log(jsonData); // You can use this JSON data as needed
  };

  const exportToPDF = () => {
    html2canvas(contentRef.current).then((canvas) => {
      const contentWidth = canvas.width;
      const contentHeight = canvas.height;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const position = 0;
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, contentWidth, contentHeight);
      pdf.save('template.pdf');
    });
  };

  return (
    <div>
      <h1>Template Builder</h1>

      <div>
        <label htmlFor="imageInput">Upload Image:</label>
        <input type="file" id="imageInput" accept="image/*" onChange={handleImageChange} />
      </div>

      <div>
        <label htmlFor="textInput">Enter Text:</label>
        <input type="text" id="textInput" value={text} onChange={handleTextChange} />
      </div>

      <div ref={contentRef}>
        {image && (
          <div>
            <h3>Image Preview:</h3>
            <img src={URL.createObjectURL(image)} alt="Uploaded" />
          </div>
        )}
        {text && (
          <div>
            <h3>Entered Text:</h3>
            <p>{text}</p>
          </div>
        )}
      </div>

      <div>
        <button onClick={exportToJSON}>Export to JSON</button>
        <button onClick={exportToPDF}>Export to PDF</button>
      </div>
    </div>
  );
};

export default TemplateBuilder;
