import React, { useEffect, useState } from 'react';
import '../../styles/ViewReports.css';
import { API_URL } from '../../config';


interface Report {
  id: string;
  title: string;
  type: 'student' | 'exam' | 'course' | 'system';
  data: any;
  generatedDate: string;
  summary?: string;
  description?: string;
}

interface StudentPerformance {
  student_id: number;
  student_name: string;
  email: string;
  enrolled_courses: number;
  completed_courses: number;
  total_attempts: number;
  average_score: number;
  pass_rate: number;
}

interface CourseAnalytics {
  course_id: number;
  course_title: string;
  total_enrolled: number;
  completed_count: number;
  average_progress: number;
  average_rating: number;
}

interface ExamAnalytics {
  exam_id: number;
  exam_title: string;
  total_attempts: number;
  average_score: number;
  pass_rate: number;
  highest_score: number;
  lowest_score: number;
}

const ViewReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [studentsPerformance, setStudentsPerformance] = useState<StudentPerformance[]>([]);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [examAnalytics, setExamAnalytics] = useState<ExamAnalytics[]>([]);
  const [activeTab, setActiveTab] = useState<'students' | 'courses' | 'exams'>('students');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      
      const [studentsRes, coursesRes, examsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/reports/students-performance`, { headers }),
        fetch(`${API_URL}/reports/courses-analytics`, { headers }),
        fetch(`${API_URL}/reports/exams-analytics`, { headers }),
        fetch(`${API_URL}/reports/summary`, { headers }),
      ]);
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudentsPerformance(studentsData.data || []);
      }
      
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourseAnalytics(coursesData.data || []);
      }
      
      if (examsRes.ok) {
        const examsData = await examsRes.json();
        setExamAnalytics(examsData.data || []);
      }
      
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        const reportsData = json.data || json.reports || json;
        setReports(Array.isArray(reportsData) ? reportsData : []);
      }
      
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = (data: any[], filename: string) => {
    if (!data.length) {
      alert('No data to download');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const fieldLabels: Record<string, string> = {
    student_name: 'Student Name',
    email: 'Email',
    enrolled_courses: 'Enrolled Courses',
    completed_courses: 'Completed Courses',
    total_attempts: 'Total Attempts',
    average_score: 'Average Score',
    pass_rate: 'Pass Rate',
    exam_title: 'Exam Title',
    highest_score: 'Highest Score',
    lowest_score: 'Lowest Score',
    course_title: 'Course Title',
    total_enrolled: 'Total Enrolled',
    completed_count: 'Completed',
    average_progress: 'Average Progress',
    average_rating: 'Average Rating',
    total_users: 'Total Users',
    total_students: 'Total Students',
    total_instructors: 'Total Instructors',
    total_courses: 'Total Courses',
    published_courses: 'Published Courses',
    total_exams: 'Total Exams',
    published_exams: 'Published Exams',
    graded_attempts: 'Graded Attempts',
    passed_attempts: 'Passed Attempts',
    failed_attempts: 'Failed Attempts',
    pass_rate_pct: 'Pass Rate',
    average_score_pct: 'Average Score',
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return `${value}%`;
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const renderData = (data: any): React.ReactNode[] => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return [<p key="empty" className="report-line">No detailed data available.</p>];
    }

    const sections: React.ReactNode[] = [];

    Object.keys(data).forEach((key) => {
      const value = data[key];

      if (Array.isArray(value)) {
        sections.push(
          <h4 key={`${key}-heading`} className="report-subheading">
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </h4>
        );
        value.forEach((item, index) => {
          if (item && typeof item === 'object') {
            sections.push(
              <div key={`${key}-${index}`} className="report-item">
                {Object.keys(item).map((field) => (
                  <p key={field} className="report-line">
                    <span className="report-label">{fieldLabels[field] || field.replace(/_/g, ' ')}:</span>{' '}
                    {formatValue(item[field])}
                  </p>
                ))}
              </div>
            );
          } else {
            sections.push(
              <p key={`${key}-${index}`} className="report-line">{String(item)}</p>
            );
          }
        });
      } else if (value && typeof value === 'object') {
        sections.push(
          <div key={key} className="report-item">
            {Object.keys(value).map((field) => (
              <p key={field} className="report-line">
                <span className="report-label">{fieldLabels[field] || field.replace(/_/g, ' ')}:</span>{' '}
                {formatValue(value[field])}
              </p>
            ))}
          </div>
        );
      } else {
        sections.push(
          <p key={key} className="report-line">
            <span className="report-label">{fieldLabels[key] || key.replace(/_/g, ' ')}:</span>{' '}
            {formatValue(value)}
          </p>
        );
      }
    });

    return sections;
  };

  const reportToText = (report: Report): string => {
    const lines: string[] = [];
    lines.push(report.title);
    lines.push(`Generated: ${report.generatedDate}`);
    lines.push('');
    if (report.description) {
      lines.push(report.description);
      lines.push('');
    }
    const render = (data: any) => {
      if (!data || typeof data !== 'object') return;
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (Array.isArray(value)) {
          lines.push(`${key.charAt(0).toUpperCase() + key.slice(1)}:`);
          value.forEach((item: any) => {
            if (item && typeof item === 'object') {
              lines.push(
                Object.keys(item)
                  .map((f) => `${fieldLabels[f] || f.replace(/_/g, ' ')}: ${formatValue(item[f])}`)
                  .join(' | ')
              );
            } else {
              lines.push(String(item));
            }
          });
        } else if (value && typeof value === 'object') {
          lines.push(
            `${key.charAt(0).toUpperCase() + key.slice(1)}: ` +
            Object.keys(value)
              .map((f) => `${fieldLabels[f] || f.replace(/_/g, ' ')}: ${formatValue(value[f])}`)
              .join(' | ')
          );
        } else {
          lines.push(`${fieldLabels[key] || key.replace(/_/g, ' ')}: ${formatValue(value)}`);
        }
      });
    };
    render(report.data);
    return lines.join('\n');
  };

  const handleDownloadReport = (report: Report) => {
    try {
      const text = reportToText(report);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.href = url;
      const fileName = `${report.title.toLowerCase().replace(/\s+/g, '_')}_report.txt`;
      linkElement.download = fileName;
      linkElement.click();
      window.URL.revokeObjectURL(url);
      alert('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const handlePrintReport = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${report.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #333; }
              .date { color: #666; margin: 20px 0; }
              .description { font-size: 1rem; margin: 20px 0; }
              pre { white-space: pre-wrap; font-family: inherit; background: #f5f5f5; padding: 12px; border-radius: 6px; }
            </style>
          </head>
          <body>
            <h1>${report.title}</h1>
            <p class="date">Generated: ${report.generatedDate}</p>
            <p class="date">Printed: ${new Date().toLocaleString()}</p>
            <hr/>
            ${report.description ? `<p class="description">${report.description}</p>` : ''}
            <pre>${reportToText(report)}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) return <div className="loading">Loading reports...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="view-reports">
      <div className="page-header">
        <h1>Reports & Analytics Dashboard</h1>
        <button onClick={fetchReports} className="btn btn-secondary">
          Refresh
        </button>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Student Performance
        </button>
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Course Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          Exam Analytics
        </button>
      </div>

      {activeTab === 'students' && (
        <div className="analytics-section">
          <div className="section-header">
            <h2>Student Performance Overview</h2>
            <button 
              onClick={() => handleDownloadCSV(studentsPerformance, 'student_performance')}
              className="btn-small btn-download"
            >
              Export CSV
            </button>
          </div>
          
          {studentsPerformance.length === 0 ? (
            <p className="no-data">No student data available</p>
          ) : (
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Enrolled Courses</th>
                    <th>Completed Courses</th>
                    <th>Completion Rate</th>
                    <th>Total Attempts</th>
                    <th>Average Score</th>
                    <th>Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsPerformance.map((student) => (
                    <tr key={student.student_id}>
                      <td>{student.student_name}</td>
                      <td>{student.email}</td>
                      <td className="text-center">{student.enrolled_courses}</td>
                      <td className="text-center">{student.completed_courses}</td>
                      <td className="text-center">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${student.enrolled_courses > 0 ? (student.completed_courses / student.enrolled_courses) * 100 : 0}%` }}
                          />
                          <span>{student.enrolled_courses > 0 ? Math.round((student.completed_courses / student.enrolled_courses) * 100) : 0}%</span>
                        </div>
                      </td>
                      <td className="text-center">{student.total_attempts}</td>
                      <td className="text-center">{student.average_score}%</td>
                      <td className="text-center">
                        <span className={`pass-rate ${student.pass_rate >= 70 ? 'high' : student.pass_rate >= 50 ? 'medium' : 'low'}`}>
                          {student.pass_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="analytics-section">
          <div className="section-header">
            <h2>Course Analytics</h2>
            <button 
              onClick={() => handleDownloadCSV(courseAnalytics, 'course_analytics')}
              className="btn-small btn-download"
            >
              Export CSV
            </button>
          </div>
          
          {courseAnalytics.length === 0 ? (
            <p className="no-data">No course data available</p>
          ) : (
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Course Title</th>
                    <th>Total Enrolled</th>
                    <th>Completed</th>
                    <th>Completion Rate</th>
                    <th>Average Progress</th>
                    <th>Average Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {courseAnalytics.map((course) => (
                    <tr key={course.course_id}>
                      <td>{course.course_title}</td>
                      <td className="text-center">{course.total_enrolled}</td>
                      <td className="text-center">{course.completed_count}</td>
                      <td className="text-center">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${course.total_enrolled > 0 ? (course.completed_count / course.total_enrolled) * 100 : 0}%` }}
                          />
                          <span>{course.total_enrolled > 0 ? Math.round((course.completed_count / course.total_enrolled) * 100) : 0}%</span>
                        </div>
                      </td>
                      <td className="text-center">{course.average_progress}%</td>
                      <td className="text-center">{course.average_rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'exams' && (
        <div className="analytics-section">
          <div className="section-header">
            <h2>Exam Analytics</h2>
            <button 
              onClick={() => handleDownloadCSV(examAnalytics, 'exam_analytics')}
              className="btn-small btn-download"
            >
              Export CSV
            </button>
          </div>
          
          {examAnalytics.length === 0 ? (
            <p className="no-data">No exam data available</p>
          ) : (
            <div className="table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Total Attempts</th>
                    <th>Average Score</th>
                    <th>Pass Rate</th>
                    <th>Highest Score</th>
                    <th>Lowest Score</th>
                  </tr>
                </thead>
                <tbody>
                  {examAnalytics.map((exam) => (
                    <tr key={exam.exam_id}>
                      <td>{exam.exam_title}</td>
                      <td className="text-center">{exam.total_attempts}</td>
                      <td className="text-center">{exam.average_score}%</td>
                      <td className="text-center">
                        <span className={`pass-rate ${exam.pass_rate >= 70 ? 'high' : exam.pass_rate >= 50 ? 'medium' : 'low'}`}>
                          {exam.pass_rate}%
                        </span>
                      </td>
                      <td className="text-center success">{exam.highest_score}%</td>
                      <td className="text-center warning">{exam.lowest_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="reports-container">
        <div className="reports-list">
          <h3>Summary Reports</h3>
          <div className="reports-grid">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`report-card ${report.type} ${selectedReport?.id === report.id ? 'active' : ''}`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="report-icon">
                  {report.type === 'student' && '👥'}
                  {report.type === 'exam' && '📝'}
                  {report.type === 'course' && '📚'}
                  {report.type === 'system' && '⚙️'}
                </div>
                <div className="report-info">
                  <h4>{report.title}</h4>
                  <p className="date">📅 {report.generatedDate}</p>
                  {report.summary && <p className="summary">{report.summary}</p>}
                </div>
              </div>
            ))}
          </div>
          {reports.length === 0 && !loading && <div className="no-data">No reports available</div>}
        </div>

        {selectedReport ? (
          <div className="report-details">
            <div className="report-header">
              <div>
                <h2>{selectedReport.title}</h2>
                <p className="generated-date">Generated on: {new Date(selectedReport.generatedDate).toLocaleDateString()}</p>
              </div>
              <div className="action-buttons">
                <button onClick={() => handleDownloadReport(selectedReport)} className="btn-small btn-download">
                  Download
                </button>
                <button onClick={() => handlePrintReport(selectedReport)} className="btn-small btn-print">
                  Print
                </button>
              </div>
            </div>
            <div className="report-content">
              {selectedReport.description && (
                <div className="report-section description">
                  <h3>Overview</h3>
                  <p>{selectedReport.description}</p>
                </div>
              )}
              <div className="report-section">
                <h3>Report Details</h3>
                <div className="report-body">{renderData(selectedReport.data)}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-report-selected">
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <h3>Select a Report</h3>
              <p>Choose a report from the left panel to view detailed analytics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewReports;