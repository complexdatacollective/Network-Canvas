import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { NewFilterableListWrapper, NodeBin } from '../../components';
import { actionCreators as installedProtocolActions } from '../../ducks/modules/protocols';
import { Overlay } from '../Overlay';
import { DragSource } from '../../behaviours/DragAndDrop';
import { ProtocolCard } from '../../components/Cards';
import { entityAttributesProperty } from '../../ducks/modules/network';

const ManageProtocolsOverlay = ({
  show,
  onClose,
  protocols,
  deleteProtocol,
}) => {
  const formattedProtocols = [...Object.keys(protocols)].map((protocolUID) => {
    const {
      schemaVersion,
      lastModified,
      installationDate,
      name,
      description,
    } = protocols[protocolUID];

    return {
      [entityAttributesProperty]: {
        schemaVersion,
        lastModified,
        installationDate,
        name,
        description,
      },
      meta: () => ({ protocolUID }),
    };
  });

  const DraggableProtocolCard = DragSource(ProtocolCard);

  return (
    <Overlay
      show={show}
      onClose={onClose}
      title="Installed Protocols"
    >
      <p>
        These are the protocols that are currently installed on this device. To
        delete a protocol, drag it with your mouse or finger into the bin that
        will appear at the bottom of the screen.
      </p>
      <NewFilterableListWrapper
        ItemComponent={DraggableProtocolCard}
        items={formattedProtocols}
        propertyPath={entityAttributesProperty}
        initialSortProperty="name"
        initialSortDirection="asc"
        sortableProperties={[
          {
            label: 'Name',
            variable: 'name',
          },
          {
            label: 'Installed',
            variable: 'installationDate',
          },
          {
            label: 'Modified',
            variable: 'lastModified',
          },
        ]}
      />
      <NodeBin
        accepts={() => true}
        dropHandler={({ protocolUID }) => deleteProtocol(protocolUID)}
        id="PROTOCOL_BIN"
      />
    </Overlay>
  );
};

ManageProtocolsOverlay.propTypes = {
  protocols: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  return {
    protocols: state.protocols,
  };
}

const mapDispatchToProps = {
  deleteProtocol: installedProtocolActions.deleteProtocol,
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageProtocolsOverlay);
