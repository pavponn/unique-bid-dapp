import React from 'react'
import {PageHeader} from 'antd';
import PropTypes from 'prop-types';

export default function Header(props) {
    return (
        <div onClick={() => {
            window.open("https://github.com/austintgriffith/scaffold-eth");
        }}>
            <PageHeader
                title={props.title}
                subTitle={props.subTitle}
                style={{cursor: 'pointer'}}
            />
        </div>
    );
}

Header.propTypes = {
    title: PropTypes.string.isRequired,
    subTitle: PropTypes.string.isRequired,
};
