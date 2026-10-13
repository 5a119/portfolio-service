export const profile = {
  name: 'Sang Nguyen', image: `${import.meta.env.BASE_URL}profile.webp`, role: 'Software Engineer II',
  headline: 'I build backend systems people can rely on.',
  location: 'San Francisco, CA',
  email: 'snguyen4work@gmail.com',
  github: 'https://github.com/5a119/',
  linkedin: 'https://www.linkedin.com/in/sangoscar99/',
  summary: 'I turn complex requirements into reliable backend services using Java, Spring Boot, and AWS. I bring those systems from design to deployment and keep them running smoothly in production.',
  about: [
    'At Blackhawk Network, I build cloud-native services for order management, from distributed workflows and data storage to caching and AWS infrastructure. I work primarily with Java and Spring Boot, with a focus on reliability, maintainability, and how systems behave in production.',
    'That work includes reusable search tooling with MongoDB Atlas, event-driven integrations, automated testing, and release pipelines. I also support services on call, investigate failures, and validate fixes. My earlier experience as a peer tutor shaped how I explain technical ideas and help others work through complex problems.'
  ],
};
export const navigation = [
  { label: 'About', id: 'about' },
  { label: 'Experience', id: 'experience' },
  { label: 'Education', id: 'education' },
  { label: 'Projects', id: 'projects' },
  { label: 'Skills', id: 'skills' },
];
export const experience = [
  {
    company: 'Blackhawk Network', role: 'Software Engineer II',
    dates: 'July 2022 – Present', location: 'Pleasanton, CA',
    bullets: [
      'Designed and delivered a cloud-native order management platform processing 40K+ orders a day across distributed services and AWS infrastructure.',
      'Containerized services with Docker and deployed them to AWS ECS through Jenkins pipelines, using CloudFormation to provision infrastructure.',
      'Built a reusable Java library that translates RSQL expressions into MongoDB Atlas Search pipelines, giving downstream services consistent search capabilities.',
      'Built event-driven workflows with AWS EventBridge, SNS, and SQS to send order notifications as orders move through their lifecycle.',
      'Advanced TDD and BDD practices with JUnit, Mockito, Cucumber, and Karate, increasing code coverage by 40% and reducing production bugs by 50%, with zero critical vulnerabilities.',
      'Led production investigations across services, databases, queues, and logs; validated fixes and caught defects before they affected customers.',
    ],
    technologies: ['Java', 'Spring Boot', 'AWS', 'MongoDB Atlas Search', 'Docker', 'Jenkins'],
  },
  {
    company: 'Contra Costa College', role: 'Peer Tutor',
    dates: 'February 2018 – December 2019', location: 'San Pablo, CA',
    bullets: ['Helped 60+ students strengthen their understanding of computer science, mathematics, and statistics through personalized instruction and progress monitoring.'],
    technologies: ['Computer Science', 'Mathematics', 'Statistics', 'Mentoring'],
  },
];
export const skillCategories = [
  { title: 'Languages & Web', icon: 'code', skills: ['Java', 'Python', 'JavaScript', 'SQL', 'HTML / CSS', 'React', 'D3.js'] },
  { title: 'Backend & Architecture', icon: 'server', skills: ['Spring Boot', 'Spring Framework', 'REST API Design', 'Microservices', 'Distributed Systems', 'Event-Driven Architecture', 'OAuth 2.0'] },
  { title: 'AWS & Cloud Delivery', icon: 'cloud', skills: ['ECS', 'ECR', 'EventBridge', 'SNS', 'SQS', 'CloudFormation', 'Docker'] },
  { title: 'Data & Search', icon: 'database', skills: ['MongoDB', 'MongoDB Atlas Search', 'Redis', 'NoSQL Databases', 'Database Optimization', 'Caching Strategies'] },
  { title: 'Testing & Quality', icon: 'test', skills: ['Test-Driven Development', 'Behavior-Driven Development', 'JUnit', 'Mockito', 'Cucumber', 'Karate'] },
  { title: 'Developer Tools', icon: 'tools', skills: ['Git', 'Bash', 'Maven', 'Jenkins', 'GitHub Actions', 'CI/CD'] },
];
export const projects = [
  {
    title: 'Tracitivity', category: 'Activity tracking & visualization',
    dates: 'March 2021 – May 2021', visual: 'activity',
    description: 'A full-stack application for securely recording activity sessions, exploring activity data, and keeping track of reminders.',
    highlights: ['Implemented OAuth 2.0 authentication and secure access-token exchange with protected Google APIs.', 'Built activity storage and retrieval, interactive D3.js visualizations, and automated reminders.'],
    technologies: ['Java', 'D3.js', 'OAuth 2.0', 'REST API', 'Google APIs'],
  },
  {
    title: 'Shop Till You Drop', category: 'College cost exploration',
    dates: 'May 2021 – June 2021', visual: 'web',
    description: 'A responsive React application that helps students estimate tuition costs using College Scorecard data.',
    highlights: ['Created reusable, accessible React components for desktop, tablet, and mobile.', 'Optimized College Scorecard API calls and automated integration and delivery with GitHub Actions.'],
    technologies: ['React', 'REST API', 'GitHub Actions', 'CI/CD'],
  },
];
export const education = [
  { school: 'University of California, Davis', degree: 'Bachelor of Science in Computer Science', dates: 'July 2020 – May 2022', location: 'Davis, CA', gpa: '3.67 / 4.00', honors: '', logo: 'uc-davis-logo.svg', logoTheme: 'davis' },
  { school: 'Contra Costa College', degree: 'Associate in Arts, Math & Science', dates: 'July 2017 – May 2020', location: 'San Pablo, CA', gpa: '3.90', honors: 'Dean’s List · President’s Scholar', logo: 'contra-costa-college-logo.png', logoTheme: 'ccc' },
];


export const sections = {
  "about": {
    "eyebrow": "01 · About",
    "title": "Thoughtful design. Dependable software."
  },
  "experience": {
    "eyebrow": "02 · Experience",
    "title": "Built to hold up in production.",
    "description": "Backend engineering, cloud delivery, and hands-on production support."
  },
  "education": {
    "eyebrow": "03 · Education",
    "title": "A foundation in computer science."
  },
  "projects": {
    "eyebrow": "04 · Selected Work",
    "title": "Useful ideas, built into working software.",
    "description": "Academic projects exploring secure integrations, interactive data, and accessible web experiences."
  },
  "skills": {
    "eyebrow": "05 · Technical Toolkit",
    "title": "Tools for building and improving systems."
  },
  "certifications": {
    "eyebrow": "06 · Learning",
    "title": "Learning that carries into the work."
  },
  "contact": {
    "eyebrow": "07 · Contact",
    "title": "Let’s build something dependable.",
    "description": "Have a software engineering opportunity or a challenging backend problem? Let’s talk about how I can help."
  }
};

export const actions = {
  talk: 'Let’s talk',
  email: 'Email Me',
};
export const learning = {
  title: 'Certifications & Continuous Learning',
  status: 'In Progress',
  description: 'I’m building on my experience through ongoing study and hands-on practice. Completed certifications and learning milestones will appear here as I earn them.',
  next: 'More milestones ahead.',
};
export const contact = {
  heading: 'Good engineering starts with a conversation.',
  body: 'I’m interested in opportunities to design dependable services, simplify complex systems, and help teams deliver reliable software.',
  emailLabel: 'Reach me directly',
};
