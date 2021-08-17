import React, {ReactElement} from 'react';
import AppBar from '@material-ui/core/AppBar';
import MuiTabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import MuiToolbar from '@material-ui/core/Toolbar';
import {withStyles} from '@material-ui/core';

const Toolbar = withStyles(theme => ({
  root: {
    minHeight: 0,
  },
}))(MuiToolbar);

const Tabs = withStyles(theme => ({
  indicator: {
    height: '3px',
  },
}))(MuiTabs);
interface LinkTabProps {
  label?: string;
  href?: string;
  value: string;
}

export const LinkTab = (props: LinkTabProps) => (
  <Tab component="a" {...props} />
);

type UiTabsProps = {
  children: ReactElement[];
  tabValue: string | boolean;
};

export const UiTabs = ({children, tabValue}: UiTabsProps) => (
  <Tabs value={tabValue}>{children}</Tabs>
);

export const UiAppBar: React.FC = ({children}) => (
  <AppBar position="absolute">
    <Toolbar>{children}</Toolbar>
  </AppBar>
);
