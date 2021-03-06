// @flow
import React, { useState } from "react"
import ReactDOM from "react-dom"
import Editor, { examples } from "./Editor"
import Annotator from "../Annotator"
import ErrorBoundaryDialog from "./ErrorBoundaryDialog.js"

function CustomPopup(props) {
  return(<div>123</div>)
}

export default () => {
  const [annotatorOpen, changeAnnotatorOpen] = useState(false)
  const [annotatorProps, changeAnnotatorProps] = useState(examples["Custom"]())
  const [lastOutput, changeLastOutput] = useState()
  const [readOnly, setReadOnly] = useState(false)

  return (
    <div>
      <button onClick={() => setReadOnly(!readOnly)}>readOnly switch</button>
      {annotatorOpen ? (
        <ErrorBoundaryDialog
          onClose={() => {
            changeAnnotatorOpen(false)
          }}
        >
          <Annotator
            {...(annotatorProps: any)}
            onExit={(output) => {
              delete (output: any)["lastAction"]
              changeLastOutput(output)
              changeAnnotatorOpen(false)
            }}
            // customCloseRegion={(region) => {
            //   return 25;
            // }}
            // customDeleteRegion={(region) => {
            //   console.log(region,'test customDeleteRegion')
            // }}
            CustomPopup={CustomPopup}
            disableClasses={true}
            disableTags={true}
            disableRegionType={true}
            customAddRegionClick={() => console.log('custom add region click')}
            disableTopNav={true}
            onLinkResource={(region_id) => console.log(region_id,'onLinkResource')}
            // customOpenRegion={(region_id) => console.log(region_id,'customOpenRegion')}
            // customMouseDown={() => console.log('customMouseDown')}
            // customSelectRegion={(region) => console.log(region,'customSelectRegion')}
            images={[
              {
                src: "https://images.unsplash.com/photo-1496905583330-eb54c7e5915a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80",
                name: "Image 1",
                regions: [
                  {
                    type: "box",
                    x: 0.25,
                    y: 0.25,
                    w: 0.5,
                    h: 0.5,
                    color: "#00f",
                    id: 222,
                  },
                ]
              }
            ]}
            newRegions={[
              {
                type: "box",
                x: 0.25,
                y: 0.25,
                w: 0.5,
                h: 0.5,
                color: "#00f",
                id: 222,
              },
              {
                type: "box",
                x: 0.8,
                y: 0.25,
                w: 0.1,
                h: 0.1,
                highlighted: true,
                color: "#00f",
                id: 333,
              },
            ]}
            readOnly={readOnly}
            hideName={false}
          />
        </ErrorBoundaryDialog>
      ) : (
        <Editor
          lastOutput={lastOutput}
          onOpenAnnotator={(props) => {
            changeAnnotatorProps(props)
            changeAnnotatorOpen(true)
          }}
        />
      )}
    </div>
  )
}
