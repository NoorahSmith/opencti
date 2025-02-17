import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose, propOr } from 'ramda';
import { withRouter } from 'react-router-dom';
import { QueryRenderer } from '../../../relay/environment';
import {
  buildViewParamsFromUrlAndStorage,
  saveViewParameters,
} from '../../../utils/ListParameters';
import inject18n from '../../../components/i18n';
import ListLines from '../../../components/list_lines/ListLines';
import WorkspacesLines, { workspacesLinesQuery } from './WorkspacesLines';
import WorkspaceCreation from './WorkspaceCreation';
import Security from '../../../utils/Security';
import { EXPLORE_EXUPDATE } from '../../../utils/hooks/useGranted';

class Dashboards extends Component {
  constructor(props) {
    super(props);
    const params = buildViewParamsFromUrlAndStorage(
      props.history,
      props.location,
      'view-workspaces',
    );
    this.state = {
      sortBy: propOr('name', 'sortBy', params),
      orderAsc: propOr(true, 'orderAsc', params),
      searchTerm: propOr('', 'searchTerm', params),
      view: propOr('lines', 'view', params),
      openExports: false,
      numberOfElements: { number: 0, symbol: '' },
    };
  }

  saveView() {
    saveViewParameters(
      this.props.history,
      this.props.location,
      'view-workspaces',
      this.state,
    );
  }

  handleSearch(value) {
    this.setState({ searchTerm: value }, () => this.saveView());
  }

  handleSort(field, orderAsc) {
    this.setState({ sortBy: field, orderAsc }, () => this.saveView());
  }

  setNumberOfElements(numberOfElements) {
    this.setState({ numberOfElements });
  }

  renderLines(paginationOptions) {
    const { sortBy, orderAsc, searchTerm, numberOfElements } = this.state;
    const dataColumns = {
      name: {
        label: 'Name',
        width: '35%',
        isSortable: true,
      },
      tags: {
        label: 'Tags',
        width: '25%',
        isSortable: false,
      },
      creator: {
        label: 'Creator',
        width: '10%',
        isSortable: true,
      },
      created_at: {
        label: 'Creation date',
        width: '15%',
        isSortable: true,
      },
      updated_at: {
        label: 'Modification date',
        width: '15%',
        isSortable: true,
      },
    };
    return (
      <ListLines
        sortBy={sortBy}
        orderAsc={orderAsc}
        dataColumns={dataColumns}
        handleSort={this.handleSort.bind(this)}
        handleSearch={this.handleSearch.bind(this)}
        keyword={searchTerm}
        secondaryAction={true}
        paginationOptions={paginationOptions}
        numberOfElements={numberOfElements}
      >
        <QueryRenderer
          query={workspacesLinesQuery}
          variables={{ count: 25, ...paginationOptions }}
          render={({ props }) => (
            <WorkspacesLines
              data={props}
              paginationOptions={paginationOptions}
              dataColumns={dataColumns}
              initialLoading={props === null}
              setNumberOfElements={this.setNumberOfElements.bind(this)}
            />
          )}
        />
      </ListLines>
    );
  }

  render() {
    const { view, sortBy, orderAsc, searchTerm } = this.state;
    const paginationOptions = {
      search: searchTerm,
      orderBy: sortBy,
      orderMode: orderAsc ? 'asc' : 'desc',
      filters: [{ key: 'type', values: ['dashboard'] }],
    };
    return (
      <div>
        {view === 'lines' ? this.renderLines(paginationOptions) : ''}
        <Security needs={[EXPLORE_EXUPDATE]}>
          <WorkspaceCreation
            paginationOptions={paginationOptions}
            type="dashboard"
          />
        </Security>
      </div>
    );
  }
}

Dashboards.propTypes = {
  t: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
};

export default compose(inject18n, withRouter)(Dashboards);
