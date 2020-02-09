import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import PropTypes from 'prop-types';
import Select from 'react-select';
import api from '../../services/api';

import { Container } from '../../components/Container';
import { Loading, Owner, IssueList, Pagination, SelectState } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    page: 1,
    option: 'all',
    perPage: 30,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'all',
          per_page: 30,
          page: 1,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
      page: 1,
    });
  }

  setIssues = async () => {
    const { match } = this.props;

    const repoName = decodeURIComponent(match.params.repository);

    const { page, option, perPage } = this.state;

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: option,
        per_page: perPage,
        page,
      },
    });

    this.setState({
      issues: issues.data,
    });
  };

  onIssueStateChange = async e => {
    await this.setState({
      option: e.value,
      page: 1,
    });

    this.setIssues();
  };

  handlePagination = async action => {
    const { page } = this.state;

    await this.setState({
      page: action === 'next' ? page + 1 : page - 1,
    });

    this.setIssues();
  };

  render() {
    const { repository, issues, loading, page } = this.state;

    const options = [
      { value: 'closed', label: 'Closed' },
      { value: 'open', label: 'Open' },
      { value: 'all', label: 'All' },
    ];

    if (loading) {
      return <Loading>Loading</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Back to repositories</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <SelectState>
          <Select
            onChange={this.onIssueStateChange}
            options={options}
            placeholder="All"
          />
        </SelectState>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pagination>
          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.handlePagination('prev')}
          >
            Prev
          </button>
          <span>Page {page}</span>
          <button
            type="button"
            onClick={() => this.handlePagination('next')}
            disabled={issues.length < 30}
          >
            Next
          </button>
        </Pagination>
      </Container>
    );
  }
}
