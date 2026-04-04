const request = require('supertest');
const app = require('../src/app');

// Mock out the resumeAnalyzer pipeline so we don't actually hit Gemini or GitHub API in our basic route test
jest.mock('../src/services/resumeAnalyzer', () => ({
    analyzeResumePipeline: jest.fn().mockResolvedValue({
        extractedData: { contactInfo: { name: "Mock User" } },
        verificationReport: { atsAnalysis: { atsScore: 85 } }
    })
}));

describe('POST /api/analyze-resume', () => {
    it('should return 400 if no file is uploaded', async () => {
        const response = await request(app).post('/api/analyze-resume');
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("No resume file uploaded");
    });

    it('should return 400 if mimetype is not PDF', async () => {
        const response = await request(app)
            .post('/api/analyze-resume')
            .attach('resume', Buffer.from('fake image data'), { filename: 'test.png', contentType: 'image/png' });
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain("Only PDF files are supported");
    });
    
    it('should return 200 and success response if a valid PDF is uploaded', async () => {
        const response = await request(app)
            .post('/api/analyze-resume')
            .attach('resume', Buffer.from('fake pdf data'), { filename: 'test.pdf', contentType: 'application/pdf' });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.extractedData.contactInfo.name).toBe("Mock User");
    });
});
