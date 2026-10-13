import {Component} from 'react';
import {profile} from '../data/portfolio';

export default class AppErrorBoundary extends Component {
  state = {hasError: false};

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  render() {
    if (this.state.hasError) {
      return <main className="boot-fallback">
        <p className="boot-fallback__eyebrow">{profile.name} · {profile.role}</p>
        <h1>Thanks for stopping by.</h1>
        <p>The portfolio could not finish rendering. You can still reach me or view my resume.</p>
        <p className="boot-fallback__links">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={profile.resume} target="_blank" rel="noopener noreferrer">View resume</a>
          <button type="button" onClick={() => window.location.reload()}>Reload portfolio</button>
        </p>
      </main>;
    }

    return this.props.children;
  }
}
