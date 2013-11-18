#include "FaceMetMuseumApp.h"

using namespace ofxCv;
using namespace cv;


void FaceMetMuseumApp::setupJson(){
    
    std::string dir = OBJECT_CROWD_SOURCER_DIR;

	// Now parse the JSON
	bool parsingSuccessful = result.open(dir+"taggedMin.json");
	
    if (parsingSuccessful) {
		cout << result.getRawString() << endl;
        
        // now write pretty print
        if(!result.save("example_output_pretty.json",true)) {
            cout << "example_output_pretty.json written unsuccessfully." << endl;
        } else {
            cout << "example_output_pretty.json written successfully." << endl;
        }
        
        // now write without pretty print
        if(!result.save("example_output_fast.json",false)) {
            cout << "example_output_pretty.json written unsuccessfully." << endl;
        } else {
            cout << "example_output_pretty.json written successfully." << endl;
        }
		
	} else {
		cout  << "Failed to parse JSON" << endl;
	}
    
    numImages = result.size();
    
    // parse!
    for(int i=0; i<result.size(); i++)
	{
        string imgUrl =result[i]["imageCache"].asString();
        cout << imgUrl<< endl;

        urls.push_back(dir+"imageCache/"+imgUrl);
    }
    frameCount = 0;
    oldFrameCount = -1;

}


void FaceMetMuseumApp::setup() {
	ofSetVerticalSync(true);
    bPaused = false;
	movieWidth = 1024;
    
    ofSetWindowTitle("FaceMetMuseum");
    ofSetWindowShape(movieWidth, ofGetScreenHeight());
    
	tracker.setup();
    
	host = "localhost";
	port = 8338;
	osc.setup(host, port);
    
	osc.setup(host, port);

    setupJson();
    bDrawMesh = true;
}

void FaceMetMuseumApp::clearBundle() {
	bundle.clear();
}

template <>
void FaceMetMuseumApp::addMessage(string address, ofVec3f data) {
	ofxOscMessage msg;
	msg.setAddress(address);
	msg.addFloatArg(data.x);
	msg.addFloatArg(data.y);
	msg.addFloatArg(data.z);
	bundle.addMessage(msg);
}

template <>
void FaceMetMuseumApp::addMessage(string address, ofVec2f data) {
	ofxOscMessage msg;
	msg.setAddress(address);
	msg.addFloatArg(data.x);
	msg.addFloatArg(data.y);
	bundle.addMessage(msg);
}

template <>
void FaceMetMuseumApp::addMessage(string address, float data) {
	ofxOscMessage msg;
	msg.setAddress(address);
	msg.addFloatArg(data);
	bundle.addMessage(msg);
}

template <>
void FaceMetMuseumApp::addMessage(string address, int data) {
	ofxOscMessage msg;
	msg.setAddress(address);
	msg.addIntArg(data);
	bundle.addMessage(msg);
}

void FaceMetMuseumApp::sendBundle() {
	osc.sendBundle(bundle);
}

void FaceMetMuseumApp::update() {
	if(bPaused) return;
    
    if (frameCount == oldFrameCount || frameCount> numImages) return;
    oldFrameCount = frameCount;
    
    image.loadImage(urls.at(frameCount));

    try{
        tracker.update(toCv(image));
    } catch(...)   {
        return;
    }

		clearBundle();

		if(tracker.getFound()) {
			addMessage("/found", 1);

			ofVec2f position = tracker.getPosition();
			addMessage("/pose/position", position);
			scale = tracker.getScale();
			addMessage("/pose/scale", scale);
			ofVec3f orientation = tracker.getOrientation();
			addMessage("/pose/orientation", orientation);

			addMessage("/gesture/mouth/width", tracker.getGesture(ofxFaceTracker::MOUTH_WIDTH));
			addMessage("/gesture/mouth/height", tracker.getGesture(ofxFaceTracker::MOUTH_HEIGHT));
			addMessage("/gesture/eyebrow/left", tracker.getGesture(ofxFaceTracker::LEFT_EYEBROW_HEIGHT));
			addMessage("/gesture/eyebrow/right", tracker.getGesture(ofxFaceTracker::RIGHT_EYEBROW_HEIGHT));
			addMessage("/gesture/eye/left", tracker.getGesture(ofxFaceTracker::LEFT_EYE_OPENNESS));
			addMessage("/gesture/eye/right", tracker.getGesture(ofxFaceTracker::RIGHT_EYE_OPENNESS));
			addMessage("/gesture/jaw", tracker.getGesture(ofxFaceTracker::JAW_OPENNESS));
			addMessage("/gesture/nostrils", tracker.getGesture(ofxFaceTracker::NOSTRIL_FLARE));

		} else {
			addMessage("/found", 0);
		}

		sendBundle();

		rotationMatrix = tracker.getRotationMatrix();
}

void FaceMetMuseumApp::draw() {
	ofSetColor(255);
	image.draw(0, 0);

	if(tracker.getFound()) {

		if(bDrawMesh) {
			ofSetLineWidth(1);
            
			tracker.getImageMesh().drawWireframe();
		
			ofPushView();
			ofSetupScreenOrtho(sourceWidth, sourceHeight, OF_ORIENTATION_UNKNOWN, true, -1000, 1000);
			ofVec2f pos = tracker.getPosition();
			ofTranslate(pos.x, pos.y);
			applyMatrix(rotationMatrix);
			ofScale(10,10,10);
			ofDrawAxis(scale);
			ofPopView();
            ofDrawBitmapStringHighlight("beautiful face", 10, 20);
		}
	} else {
		ofDrawBitmapStringHighlight("no face here", 10, 20);
	}
    
	if(bPaused) {
		ofSetColor(255, 0, 0);
		ofDrawBitmapStringHighlight( "paused", 10, 32);
	}
}

void FaceMetMuseumApp::keyPressed(int key) {
	switch(key) {
		case 'r':
			tracker.reset();
			break;
		case 'm':
			bDrawMesh = !bDrawMesh;
			break;
		case 'p':
			bPaused = !bPaused;
			break;
		case OF_KEY_UP:
			break;
		case OF_KEY_DOWN:
			break;
        case 358: //left
            frameCount++;
            frameCount = frameCount >= numImages ? numImages - 1: frameCount;
            break;
        case 356: //right
            frameCount--;
            frameCount = frameCount < 0 ? 0 : frameCount;
            break;
	}
}
