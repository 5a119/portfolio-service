export const profile = {
  name: 'Sang Nguyen', image: `${import.meta.env.BASE_URL}profile.webp`, role: 'Software Engineer II',
  headline: 'I build backends that hold up in production.',
  location: 'San Francisco, CA',
  email: 'snguyen4work@gmail.com',
  github: 'https://github.com/5a119/',
  linkedin: 'https://www.linkedin.com/in/sangoscar99/',
  summary: 'I’m Sang, a software engineer working with Java, Spring Boot, and AWS. At Blackhawk Network, I build order services and follow them from design through deployment and production support.',
  about: [
    'My work spans the parts of a backend that have to work together: services, databases, queues, and cloud infrastructure. At Blackhawk Network, I build order workflows, create reusable search tools, and investigate issues on call. Supporting what I ship keeps me thinking about how a system will behave long after the first release.',
    'Before working as an engineer, I was a peer tutor in computer science, math, and statistics. That experience shaped how I work with people: break a problem into smaller pieces, explain the reasoning, and work through it together. I bring the same patience to a tricky bug as I do to a technical conversation.'
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
      'Designed and delivered an order management platform processing more than 40,000 orders a day across distributed services on AWS.',
      'Containerized services with Docker and deployed them to AWS ECS through Jenkins pipelines, using CloudFormation to provision infrastructure.',
      'Built a reusable Java library that turns RSQL queries into MongoDB Atlas Search pipelines, so other services can share the same search logic.',
      'Connected order workflows with AWS EventBridge, SNS, and SQS to send notifications as orders move through each stage.',
      'Expanded automated testing with JUnit, Mockito, Cucumber, and Karate, increasing code coverage by 40% and reducing production bugs by 50%.',
      'Led production investigations across services, databases, queues, and logs, then validated fixes before release.',
    ],
    technologies: ['Java', 'Spring Boot', 'AWS', 'MongoDB Atlas Search', 'Docker', 'Jenkins'],
  },
  {
    company: 'Contra Costa College', role: 'Peer Tutor',
    dates: 'February 2018 – December 2019', location: 'San Pablo, CA',
    bullets: ['Helped more than 60 students work through computer science, math, and statistics problems, adapting explanations to their needs and tracking their progress.'],
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
    description: 'An activity tracker that brings session records, interactive charts, and reminders into one application.',
    highlights: ['Connected protected Google APIs using OAuth 2.0 and secure access-token exchange.', 'Built session storage and retrieval, D3.js charts, and automated reminders.'],
    technologies: ['Java', 'D3.js', 'OAuth 2.0', 'REST API', 'Google APIs'],
  },
  {
    title: 'Shop Till You Drop', category: 'College cost exploration',
    dates: 'May 2021 – June 2021', visual: 'web',
    description: 'A React application that helps students explore tuition costs using College Scorecard data.',
    highlights: ['Built reusable, accessible components that work across desktop, tablet, and mobile.', 'Optimized API calls and automated integration and delivery with GitHub Actions.'],
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
    "title": "The work goes beyond the code."
  },
  "experience": {
    "eyebrow": "02 · Experience",
    "title": "What I’ve worked on.",
    "description": "Order processing at scale, shared search tooling, and the work of keeping services running."
  },
  "education": {
    "eyebrow": "03 · Education",
    "title": "Where I studied."
  },
  "projects": {
    "eyebrow": "04 · Selected Work",
    "title": "A few things I’ve built.",
    "description": "Earlier academic projects in API integration, data visualization, and web development."
  },
  "skills": {
    "eyebrow": "05 · Skills",
    "title": "What I work with."
  },
  "contact": {
    "eyebrow": "06 · Contact",
    "title": "Let’s talk.",
    "description": "Have a role or a backend problem you’d like to discuss? I’d be glad to hear about it."
  }
};

export const actions = {
  talk: 'Let’s talk',
  email: 'Email me',
};
export const contact = {
  heading: 'A little context goes a long way.',
  body: 'Tell me about your team, what you’re building, and where you could use a hand. My strongest fit is backend work with Java, Spring Boot, and AWS.',
  emailLabel: 'Write to me',
};
