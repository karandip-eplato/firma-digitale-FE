import { Grid } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import RemoveIcon from '@material-ui/icons/Remove';
import React from 'react';
import Media from 'react-media';
import { connect } from 'react-redux';
import { setDocumentIndex, setZoom } from '../actions';
import App from './App';


const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  }
}));


const mapStateToProps = state => {
  return {
    NoOfDocuments: state.NoOfDocuments,
    DocumentIndex: state.DocumentIndex,
    SignatureIndex: state.SignatureIndex,
    ShowAppbar: state.ShowAppbar,
    ZoomValue: state.ZoomValue
  };
};
export default connect(mapStateToProps)(function ButtonAppBar(props) {
  const classes = useStyles();
  const zoomin = () => {
    var myImg = document.getElementById('document');
    var currWidth = myImg.clientWidth;
    if (currWidth >= 2500) return false;
    else {
      myImg.style.width = currWidth + 100 + 'px';
      props.dispatch(setZoom(currWidth + 100));
    }
    App.rerenderDocument();
  };

  const zoomout = () => {
    var myImg = document.getElementById('document');
    var currWidth = myImg.clientWidth;
    if (currWidth <= 100) return false;
    else {
      myImg.style.width = currWidth - 100 + 'px';
      props.dispatch(setZoom(currWidth - 100));
    }
    App.rerenderDocument();
  };
  // console.log(props.ShowAppbar);
  if (props.ShowAppbar === 0) {
    return <React.Fragment></React.Fragment>;
  } else {
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <Media query="(max-width: 799px)">
              {matches =>
                matches ? (
                  <React.Fragment>
                    <Grid item container xs={12} justify="center">
                      <Button
                        disabled={props.ShowAppbar === 2 ? true : false}
                        onClick={zoomin}
                        color="inherit"
                      >
                        <AddIcon />
                      </Button>
                      <Button
                        onClick={zoomout}
                        color="inherit"
                        disabled={props.ShowAppbar === 2 ? true : false}
                        style={{ marginRight: '3%' }}
                      >
                        <RemoveIcon />
                      </Button>
                      <Typography
                        style={{ paddingTop: '1%', marginRight: '3%' }}
                      >
                        Pagina: {props.DocumentIndex + 1}/{props.NoOfDocuments}
                      </Typography>
                      {props.DocumentIndex !== 0 && (
                        <Button
                          onClick={() => {
                            if (props.DocumentIndex > 0) {
                              props.dispatch(
                                setDocumentIndex(props.DocumentIndex - 1)
                              );
                            }
                          }}
                          disabled={props.ShowAppbar === 2 ? true : false}
                          color="inherit"
                          id="prevPage"
                        >
                          <ArrowUpwardIcon />
                        </Button>
                      )}
                      {props.DocumentIndex + 1 !== props.NoOfDocuments && (
                        <Button
                          onClick={() => {
                            if (props.DocumentIndex < props.NoOfDocuments - 1) {
                              props.dispatch(
                                setDocumentIndex(props.DocumentIndex + 1)
                              );
                            }
                          }}
                          disabled={props.ShowAppbar === 2 ? true : false}
                          color="inherit"
                          id="nextPage"
                        >
                          <ArrowDownwardIcon />
                        </Button>
                      )}
                    </Grid>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Typography variant="h6" noWrap className={classes.title}>
                      Firma
                    </Typography>
                    <Button
                      onClick={zoomin}
                      disabled={props.ShowAppbar === 2 ? true : false}
                      color="inherit"
                    >
                      <AddIcon />
                      <Typography>&nbsp;Zoom In</Typography>
                    </Button>
                    <Button
                      onClick={zoomout}
                      color="inherit"
                      disabled={props.ShowAppbar === 2 ? true : false}
                      style={{ marginRight: '3%' }}
                    >
                      <RemoveIcon />
                      <Typography>&nbsp;Zoom Out</Typography>
                    </Button>
                    <Typography style={{ marginRight: '3%' }}>
                      Pagina: {props.DocumentIndex + 1}/{props.NoOfDocuments}
                    </Typography>
                    {props.DocumentIndex !== 0 && (
                      <Button
                        onClick={() => {
                          if (props.DocumentIndex > 0) {
                            props.dispatch(
                              setDocumentIndex(props.DocumentIndex - 1)
                            );
                          }
                        }}
                        disabled={props.ShowAppbar === 2 ? true : false}
                        color="inherit"
                        id="prevPage"
                      >
                        <ArrowUpwardIcon />
                        <Typography>&nbsp;Pagina Precedente</Typography>
                      </Button>
                    )}
                    {props.DocumentIndex + 1 !== props.NoOfDocuments && (
                      <Button
                        onClick={() => {
                          if (props.DocumentIndex < props.NoOfDocuments - 1) {
                            props.dispatch(
                              setDocumentIndex(props.DocumentIndex + 1)
                            );
                          }
                        }}
                        color="inherit"
                        disabled={props.ShowAppbar === 2 ? true : false}
                        id="nextPage"
                      >
                        <ArrowDownwardIcon />
                        <Typography>&nbsp;Pagina Successiva</Typography>
                      </Button>
                    )}
                  </React.Fragment>
                )
              }
            </Media>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
});
